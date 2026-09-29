// K-SETU session auth — edge-safe (Web Crypto only). Works in middleware + routes.
export type SessionPayload = {
  sub: number;
  role: "collector" | "recycler" | "admin";
  name: string;
  exp: number;
  demo?: boolean;
};

export const SESSION_COOKIE = "ksetu_session";
const SECRET = process.env.SESSION_SECRET || "ksetu-local-demo-secret-2026";

// Clearly separated LOCAL DEMO MODE accounts. Used only as fallback when the
// database/API is unavailable, and always pre-seeded into the DB on startup.
export const DEMO_USERS = [
  { email: "collector@ksetu.demo", password: "Collector@123", role: "collector" as const, name: "Ramesh Kumar", id: 1 },
  { email: "recycler@ksetu.demo", password: "Recycler@123", role: "recycler" as const, name: "GreenCycle Recyclers", id: 2 },
  { email: "admin@ksetu.demo", password: "Admin@123", role: "admin" as const, name: "K-SETU Admin", id: 3 },
];

export function localDemoModeEnabled(): boolean {
  return process.env.DISABLE_LOCAL_DEMO !== "true";
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "===".slice((pad.length + 3) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(payload: Omit<SessionPayload, "exp">, ttlDays = 7): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + ttlDays * 86400_000 };
  const body = b64url(new TextEncoder().encode(JSON.stringify(full)));
  const k = await key();
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const k = await key();
    const ok = await crypto.subtle.verify("HMAC", k, fromB64url(sig), new TextEncoder().encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function getSessionFromHeaders(headers: Headers): Promise<SessionPayload | null> {
  const cookies = parseCookies(headers.get("cookie"));
  return verifySession(cookies[SESSION_COOKIE]);
}

export function roleHome(role: string): string {
  if (role === "collector") return "/collector";
  if (role === "recycler") return "/recycler";
  if (role === "admin") return "/admin";
  return "/login";
}

export const ROLE_PATHS: Record<string, string> = {
  collector: "/collector",
  recycler: "/recycler",
  admin: "/admin",
};
export function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(otp);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return b64url(hash);
}

export async function verifyOtpHash(
  otp: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashOtp(otp);
  return hash === storedHash;
}
