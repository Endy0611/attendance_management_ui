/**
 * proxy.ts  (Next.js 16+)
 * The exported function must be named "proxy" (was "middleware" in older Next.js).
 *
 * Two layers of protection:
 * 1. Auth gate — no accessToken cookie → redirect to /login.
 * 2. Role gate — token decoded (unverified, edge-safe) against lib/roles.ts's
 *    ROUTE_POLICY. This is UX-level routing only; the backend's JwtAuthFilter is
 *    the actual security boundary on every request regardless of what happens here.
 *
 * Requires the login flow to call setAuthCookies() (lib/server-auth.ts) so the
 * "accessToken" cookie is actually set — see CLAUDE.md §4 for the auth-pattern
 * split this depends on.
 */

import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/jwt";
import { policyFor } from "@/lib/roles";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/settings", "/change-password"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/verify-otp"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("accessToken")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtected && token) {
    const claims = decodeToken(token);
    const role = claims?.roles?.[0];
    const policy = policyFor(pathname);

    if (policy && (!role || !policy.roles.includes(role as never))) {
      const dashboardUrl = new URL("/dashboard", req.url);
      dashboardUrl.searchParams.set("denied", pathname);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};