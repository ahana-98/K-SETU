"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";

// ---------- Icons (inline SVG, stroke = currentColor) ----------
const PATHS: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  sell: <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Zm5-4h.01" />,
  chart: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  factory: <path d="M3 21V9l6 4V9l6 4V5h6v16H3Zm5-4h.01M13 17h.01" />,
  wallet: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm13 5h3" />,
  box: <path d="M21 8 12 3 3 8v8l9 5 9-5V8Zm-18 0 9 5 9-5m-9 5v8" />,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Zm-3 9 2 2 4-4" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4V8Zm8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  upload: <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 20h16" />,
  scale: <path d="M12 3v18M7 21h10M5 7h14M5 7l-2 6a3 3 0 0 0 6 0L7 7m12 0-2 6a3 3 0 0 0 6 0l-2-6" />,
  pin: <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  check: <path d="m4 12 5 5L20 6" />,
  x: <path d="m5 5 14 14M19 5 5 19" />,
  chevronR: <path d="m9 5 7 7-7 7" />,
  chevronD: <path d="m5 9 7 7 7-7" />,
  sync: <path d="M20 11a8 8 0 0 0-14-4M4 13a8 8 0 0 0 14 4M4 5v4h4m12 10v-4h-4" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c-3 3-3 15 0 18m0-18c3 3 3 15 0 18" />,
  logout: <path d="M9 4H5v16h4m3-8h9m0 0-3-3m3 3-3 3" />,
  qr: <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 3h3m3 0h-3m0 3h3m-6 0h.01" />,
  truck: <path d="M2 6h12v10H2V6Zm12 3h4l3 3v4h-7V9ZM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  bell: <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 9a2 2 0 0 0 4 0" />,
  mic: <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm-6-3a6 6 0 0 0 12 0m-6 6v3" />,
  phone: <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />,
  leaf: <path d="M5 19C5 9 13 4 20 4c0 8-5 15-15 15Zm0 0c2-5 6-9 10-11" />,
  alert: <path d="M12 3 2 20h20L12 3Zm0 7v4m0 3h.01" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M12 11v6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  up: <path d="M4 17 10 11l4 4 6-7m0 0h-5m5 0v5" />,
  down: <path d="M4 7l6 6 4-4 6 7m0 0h-5m5 0v-5" />,
  minus: <path d="M5 12h14" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 3" />,
  receipt: <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Zm3 5h6M9 12h6" />,
  scan: <path d="M4 8V4h4m8 0h4v4m0 8v4h-4M8 20H4v-4m0-4h16" />,
  nofire: <path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c0-2-1-3-1-3s3 1 3 5a5 5 0 0 1-10 0c0-5 5-7 5-10Zm7 17L5 4" />,
  noacid: <path d="M9 3h6M10 3v5l-5 9a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-9V3M4 4l16 16" />,
  battery: <path d="M3 8h14v8H3V8Zm14 2h3v4h-3M6 11h4" />,
  crt: <path d="M3 5h18v12H3V5Zm5 16h8m-4-4v4" />,
  gloves: <path d="M7 12V5a2 2 0 0 1 4 0v5m0-3a2 2 0 0 1 4 0v3m0-1a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-3l-2-2a1.6 1.6 0 0 1 2.3-2.3L7 14" />,
  tool: <path d="M14 7a4 4 0 0 1 5-4l-3 3 2 2 3-3a4 4 0 0 1-5 5L8 18a2 2 0 0 1-3-3l9-8Z" />,
  wash: <path d="M7 11a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0v-2Zm5-8v2m-7 16h14M8 21c0-2 2-3 4-3s4 1 4 3" />,
  magnet: <path d="M6 3v8a6 6 0 0 0 12 0V3m-12 0h4v6H6V3Zm8 0h4v6h-4V3Z" />,
  pcb: <path d="M6 6h12v12H6V6Zm3 3h.01M15 9h.01M9 15h.01M15 15h.01M12 6V3m0 18v-3M6 12H3m18 0h-3" />,
  cable: <path d="M4 18c4 0 4-12 8-12s4 12 8 12M4 18h.01M20 18h.01" />,
  motor: <path d="M5 8h10v8H5V8Zm10 2h4v4h-4M8 8V5m3 3V5m-3 13v-2m3 2v-2" />,
  plastic: <path d="M8 3h8l2 5-3 13H9L6 8l2-5Zm-2 5h12" />,
  copper: <path d="M12 3a9 9 0 1 0 9 9m-9-9v9m9 0h-9m0-9 6.5 6.5" />,
  aluminium: <path d="M4 20 12 4l8 16H4Zm4-5h8" />,
  other: <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M18 6l-2.5 2.5m-7 7L6 18" />,
  lcd: <path d="M3 4h18v12H3V4Zm5 16h8m-4-4v4" />,
};

export function Icon({ name, size = 22, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name] ?? PATHS.box}
    </svg>
  );
}

export const CATEGORY_ICONS: Record<string, string> = {
  CRT: "crt",
  "LCD/LED Panels": "lcd",
  PCB: "pcb",
  Cables: "cable",
  Batteries: "battery",
  Motors: "motor",
  "Magnet-bearing Assemblies": "magnet",
  "Mixed Plastics": "plastic",
  Copper: "copper",
  Aluminium: "aluminium",
  "Other E-Waste": "other",
};

// ---------- Logo ----------
// ---------- Logo ----------
export function Logo({
  size = 56,
  withWordmark = false,
  dark = false,
}: {
  size?: number;
  withWordmark?: boolean;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="shrink-0 overflow-hidden rounded-full bg-white"
        style={{ width: size, height: size }}
      >
        <Image
          src="/K-SETU_LOGO.png"
          alt="K-SETU logo"
          width={size}
          height={size}
          className="h-full w-full rounded-full object-contain"
          priority
        />
      </div>

      {withWordmark && (
        <div className="leading-none">
          <div
            className="font-extrabold tracking-tight"
            style={{ fontSize: size * 0.42 }}
          >
            <span style={{ color: dark ? "#FAFBFA" : "#163C33" }}>
              K-
            </span>
            <span style={{ color: "#5FAE46" }}>SETU</span>
          </div>

          <div
            className="mt-1 text-[10px] font-semibold tracking-[0.18em]"
            style={{ color: dark ? "#9DB8AA" : "#5B7266" }}
          >
            COLLECT • CONNECT • RECYCLE
          </div>
        </div>
      )}
    </div>
  );
}
// ---------- Buttons ----------
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
};
export function Btn({ variant = "primary", size = "md", full, className = "", ...rest }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5", lg: "text-base px-5 py-3.5" };
  const variants = {
    primary: "text-white bg-pine hover:bg-[#24653e]",
    secondary: "text-white bg-leaf hover:bg-[#4f9a3a]",
    outline: "text-pine border-2 border-pine bg-transparent hover:bg-mint",
    ghost: "text-forest hover:bg-mint",
    danger: "text-white bg-danger hover:bg-[#991b1b]",
  };
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`} {...rest} />;
}

// ---------- Surfaces ----------
export function Card({ children, className = "", tint = false }: { children: React.ReactNode; className?: string; tint?: boolean }) {
  return <div className={`rounded-xl border border-[#dcebe0] ${tint ? "bg-mint" : "bg-white"} shadow-[0_1px_3px_rgba(22,60,51,0.08)] ${className}`}>{children}</div>;
}

export function DemoTag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded bg-mint px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-sage">{children}</span>;
}

export function Badge({ tone = "neutral", children }: { tone?: "ok" | "warn" | "danger" | "neutral" | "brand"; children: React.ReactNode }) {
  const tones = {
    ok: "bg-okbg text-leaf",
    warn: "bg-warnbg text-warn",
    danger: "bg-dangerbg text-danger",
    neutral: "bg-mint text-sage",
    brand: "bg-forest text-white",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function Stat({
  label,
  value,
  sub,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  tone?: "brand" | "ok" | "warn";
}) {
  const styles = {
    brand: {
      text: "text-forest",
      icon: "bg-pine/10 text-pine",
      border: "border-pine/15",
    },
    ok: {
      text: "text-leaf",
      icon: "bg-leaf/10 text-leaf",
      border: "border-leaf/20",
    },
    warn: {
      text: "text-warn",
      icon: "bg-warn/10 text-warn",
      border: "border-warn/20",
    },
  };

  const style = styles[tone];

  return (
    <Card className={`h-full border ${style.border} bg-linear-to-br from-white to-mint/30 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sage">
            {label}
          </p>
          <p className={`mt-2 wrap-break-words text-2xl font-extrabold leading-tight ${style.text}`}>
            {value}
          </p>
          {sub && (
            <p className="mt-1.5 text-xs leading-relaxed text-sage">
              {sub}
            </p>
          )}
        </div>

        {icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
            <Icon name={icon} size={22} />
          </span>
        )}
      </div>
    </Card>
  );
}
// ---------- Forms ----------
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold tracking-wide text-ink uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-sage">{hint}</span>}
    </label>
  );
}
export const inputCls =
  "w-full rounded-lg border border-[#cfe0d4] bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/20";

// ---------- Feedback ----------
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Empty({ icon = "box", text }: { icon?: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#cfe0d4] bg-white/60 px-4 py-8 text-center">
      <span className="text-sage"><Icon name={icon} size={28} /></span>
      <p className="text-sm text-sage">{text}</p>
    </div>
  );
}

export function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-dangerbg px-3 py-2.5 text-sm text-danger">
      <span className="flex items-center gap-2"><Icon name="alert" size={16} /> {text}</span>
      {onRetry && <button onClick={onRetry} className="font-bold underline">Retry</button>}
    </div>
  );
}
export function StatusPill({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
const normalized = (status ?? "unknown").toLowerCase();
  const tone =
    ["paid", "completed", "recycled", "verified", "accepted"].includes(normalized)
      ? "border-leaf/30 bg-leaf/10 text-leaf"
      : ["pending", "quoted", "active", "handover", "in_progress"].includes(normalized)
        ? "border-warn/30 bg-warnbg text-warn"
        : ["rejected", "cancelled", "failed", "expired"].includes(normalized)
          ? "border-danger/30 bg-dangerbg text-danger"
          : "border-pine/20 bg-mint text-forest";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}

export function Trend({ dir }: { dir: string }) {
  if (dir === "up") return <span className="inline-flex items-center gap-1 text-xs font-bold text-leaf"><Icon name="up" size={14} /> Increasing</span>;
  if (dir === "down") return <span className="inline-flex items-center gap-1 text-xs font-bold text-warn"><Icon name="down" size={14} /> Decreasing</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold text-sage"><Icon name="minus" size={14} /> Stable</span>;
}

// ---------- Toasts ----------
type Toast = { id: number; text: string; tone: "ok" | "warn" | "danger" | "info" };
const ToastCtx = createContext<{ push: (text: string, tone?: Toast["tone"]) => void }>({ push: () => {} });
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  const tones = { ok: "bg-okbg text-leaf border-leaf/30", warn: "bg-warnbg text-warn border-warn/30", danger: "bg-dangerbg text-danger border-danger/30", info: "bg-mint text-forest border-pine/20" };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-100 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`rise pointer-events-auto w-full max-w-sm rounded-lg border px-3 py-2 text-sm font-semibold shadow-lg ${tones[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  return useContext(ToastCtx);
}

// ---------- Fetch helper (client) ----------
export async function api<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

export function useSession() {
  const [session, setSession] = useState<{ userId: number; role: string; name: string; demo: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setSession(d?.authenticated ? d : null);
        setLoading(false);
      })
      .catch(() => {
        setSession(null);
        setLoading(false);
      });
  }, []);
  return { session, loading };
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    });
  } finally {
    window.location.replace("/login");
  }
}