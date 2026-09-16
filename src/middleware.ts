import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("nfvs_session")?.value;

  // Verify token expiration quickly in middleware
  let isAuthenticated = false;
  if (sessionToken) {
    try {
      const json = Buffer.from(sessionToken, "base64").toString("utf-8");
      const payload = JSON.parse(json);
      if (payload.userId && payload.expiresAt && payload.expiresAt > Date.now()) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 1. Protected routes: /app and everything under /app/*
  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth routes: redirect /login to /app/overview if already logged in
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/app/overview", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
