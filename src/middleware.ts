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

  const noCache = (response: NextResponse) => {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  };

  const redirectTo = (path: string) => {
    const url = req.nextUrl.clone();
    url.pathname = path;
    return noCache(NextResponse.redirect(url));
  };

  const guard = (allowed: "collector" | "recycler" | "admin") => {
    if (!session) {
      return redirectTo("/login");
    }

    if (session.role !== allowed) {
      return redirectTo(roleHome(session.role));
    }

    return noCache(NextResponse.next());
  };

  if (pathname.startsWith("/collector")) {
    return guard("collector");
  }

  if (pathname.startsWith("/recycler")) {
    return guard("recycler");
  }

  if (pathname.startsWith("/admin")) {
    return guard("admin");
  }

  if (pathname === "/login") {
    if (session) {
      return redirectTo(roleHome(session.role));
    }
    return noCache(NextResponse.next());
  }

  if (pathname === "/") {
    return redirectTo(session ? roleHome(session.role) : "/login");
  }

  return NextResponse.next();
}