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
 * Silently attempts one token refresh if the access token has expired,
 * before giving up. This prevents a 15-minute-old access token from
 * bouncing an otherwise-valid session to /login mid-interaction (e.g.
 * right after a Server Action, when Next.js re-renders this page's
 * Server Components using whatever cookie is currently on hand).
 *
 * NOTE: cookie writes (setAuthCookies / clearAuthCookies) are only legal
 * inside a Server Action or Route Handler. This function is also called
 * from plain Server Component renders (e.g. the automatic re-render Next
 * triggers right after a Server Action completes), where a cookie write
 * throws. So the refresh network call always runs, but the cookie
 * persistence step is best-effort: if we're in a render context, the
 * write silently fails and the cookie stays stale until the next real
 * Server Action gets a chance to persist it.
 *
 * Example (Server Component):
 *   const user = await getUser()
 *   if (!user) return <GuestBanner />
 */
export async function getUser(): Promise<AppUserResponse | null> {
  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    console.log("[getUser] no accessToken cookie");
    return null;
  }

  try {
    const user = await authService.getMe(accessToken);
    console.log("[getUser] getMe succeeded");
    return user;
  } catch (err) {
    console.log("[getUser] getMe FAILED, attempting refresh:", (err as Error).message);

    if (!refreshToken) {
      console.log("[getUser] no refreshToken cookie, giving up");
      return null;
    }

    try {
      const auth = await authService.refresh({ refreshToken });
      console.log("[getUser] refresh call succeeded");

      try {
        await setAuthCookies(auth.accessToken, auth.refreshToken);
        console.log("[getUser] setAuthCookies succeeded (we're in a valid context)");
      } catch (cookieErr) {
        console.log("[getUser] setAuthCookies THREW (expected in render context):", (cookieErr as Error).message);
      }

      const user = await authService.getMe(auth.accessToken);
      console.log("[getUser] getMe with refreshed token succeeded");
      return user;
    } catch (refreshErr) {
      console.log("[getUser] refresh flow FAILED entirely:", (refreshErr as Error).message);
      try {
        await clearAuthCookies();
      } catch (clearErr) {
        console.log("[getUser] clearAuthCookies THREW:", (clearErr as Error).message);
      }
      return null;
    }
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