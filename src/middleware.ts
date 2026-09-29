import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession, roleHome } from "@/lib/auth";

export const config = {
  matcher: ["/collector/:path*", "/recycler/:path*", "/admin/:path*", "/login", "/"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const { pathname } = req.nextUrl;

  const guard = (allowed: string) => {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (session.role !== allowed) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome(session.role);
      return NextResponse.redirect(url);
    }
    return null;
  };

  if (pathname.startsWith("/collector")) return guard("collector") ?? NextResponse.next();
  if (pathname.startsWith("/recycler")) return guard("recycler") ?? NextResponse.next();
  if (pathname.startsWith("/admin")) return guard("admin") ?? NextResponse.next();

  if (pathname === "/login") {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = roleHome(session.role);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = session ? roleHome(session.role) : "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
