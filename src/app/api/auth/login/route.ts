import { NextResponse } from "next/server";
import { DEMO_USERS, SESSION_COOKIE, localDemoModeEnabled, roleHome, signSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import * as svc from "@/lib/services";

export async function POST(req: Request) {
  let body: { email?: string; password?: string; demoRole?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Demo quick-login: resolve to the seeded demo account for that role.
  if (body.demoRole) {
    const demo = DEMO_USERS.find((d) => d.role === body.demoRole);
    if (!demo) return NextResponse.json({ error: "Unknown demo role" }, { status: 400 });
    body.email = demo.email;
    body.password = demo.password;
  }

  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  console.info(`[AUTH] LOGIN REQUEST email=${email}`);

  let user: Awaited<ReturnType<typeof svc.getUserByEmail>> | null = null;
  let dbAvailable = true;
  try {
    user = await svc.getUserByEmail(email);
  } catch (e) {
    dbAvailable = false;
    console.warn("[AUTH] DATABASE UNAVAILABLE — evaluating Local Demo Mode fallback");
  }

  let sessionUser: { id: number; email: string; role: "collector" | "recycler" | "admin"; name: string } | null = null;
  let demoFallback = false;

  if (dbAvailable && user) {
    console.info(`[AUTH] USER FOUND role=${user.role}`);
    if (verifyPassword(password, user.passwordHash)) {
      sessionUser = { id: user.id, email: user.email, role: user.role as "collector" | "recycler" | "admin", name: user.name };
    }
  } else if (!dbAvailable && localDemoModeEnabled()) {
    // LOCAL DEMO MODE — clearly separated fallback so the demo never gets stuck.
    const demo = DEMO_USERS.find((d) => d.email === email);
    if (demo && demo.password === password) {
      sessionUser = { id: demo.id, email: demo.email, role: demo.role, name: demo.name };
      demoFallback = true;
      console.info(`[AUTH] LOCAL DEMO MODE login for role=${demo.role}`);
    }
  }

  if (!sessionUser) {
    return NextResponse.json({ error: dbAvailable ? "Invalid email or password." : "Server unavailable. Local Demo Mode is available." }, { status: 401 });
  }

  const token = await signSession({ sub: sessionUser.id, role: sessionUser.role, name: sessionUser.name, demo: demoFallback });
  console.info(`[AUTH] SESSION CREATED role=${sessionUser.role} → ${roleHome(sessionUser.role)}`);

  const res = NextResponse.json({
    ok: true,
    role: sessionUser.role,
    name: sessionUser.name,
    redirect: roleHome(sessionUser.role),
    demoFallback,
  });
  // SameSite=None + Secure + Partitioned so the session survives when the
  // preview is embedded in a cross-origin iframe; Lax fallback for local HTTP.
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  const secure = proto === "https";
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    partitioned: secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
