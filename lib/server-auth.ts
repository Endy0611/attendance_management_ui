/**
 * lib/server-auth.ts
 *
 * Server-side helpers for reading auth state.
 * Use these in:
 *   - Server Components (async page.tsx files)
 *   - Route Handlers (app/api/...)
 *   - Server Actions
 *
 * NEVER import this in a "use client" file.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authService } from "@/service/auth.service";
import type { AppUserResponse } from "@/types/auth-types";

// ─── Read tokens from cookies ─────────────────────────────────────────────────

export async function getTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get("accessToken")?.value ?? null,
    refreshToken: cookieStore.get("refreshToken")?.value ?? null,
  };
}

// ─── Get current user (server component usage) ────────────────────────────────

/**
 * Returns the user if logged in, or null if not.
 * Does NOT redirect — use requireUser() for that.
 *
 * Example (Server Component):
 *   const user = await getUser()
 *   if (!user) return <GuestBanner />
 */
export async function getUser(): Promise<AppUserResponse | null> {
  const { accessToken } = await getTokens();
  if (!accessToken) return null;

  try {
    return await authService.getMe(accessToken);
  } catch {
    // Token expired or invalid
    return null;
  }
}

/**
 * Returns the user or redirects to /login.
 * Use this in protected pages.
 *
 * Example (Server Component):
 *   const user = await requireUser()   // throws redirect if not logged in
 *   return <Dashboard user={user} />
 */
export async function requireUser(): Promise<AppUserResponse> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Redirects to /dashboard if already logged in.
 * Use this in login/register pages so logged-in users don't see auth forms.
 *
 * Example (Server Component for login page):
 *   await redirectIfLoggedIn()
 *   return <LoginComponent />
 */
export async function redirectIfLoggedIn() {
  const { accessToken } = await getTokens();
  if (accessToken) redirect("/dashboard");
}

// ─── Cookie helpers (called from server actions after login/logout) ───────────

/**
 * Set auth cookies after a successful login.
 * Cookies are HttpOnly so client JS cannot read or steal them.
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe = false
) {
  const cookieStore = await cookies();

  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  cookieStore.set("accessToken", accessToken, {
    ...baseOptions,
    // Access token short-lived: 15 minutes
    maxAge: 15 * 60,
  });

  cookieStore.set("refreshToken", refreshToken, {
    ...baseOptions,
    // Refresh token: 7 days if rememberMe, else session cookie
    maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
  });
}

/**
 * Clear auth cookies on logout.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}