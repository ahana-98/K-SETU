import { NextResponse } from "next/server";
import { getSessionFromHeaders } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionFromHeaders(req.headers);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    userId: session.sub,
    role: session.role,
    name: session.name,
    demo: !!session.demo,
  });
}
