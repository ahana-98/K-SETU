import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  console.info("[AUTH] LOGOUT — session cleared");
  const res = NextResponse.json({ ok: true });
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  const secure = proto === "https";
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    partitioned: secure,
    path: "/",
    maxAge: 0,
  });
  return res;
}
