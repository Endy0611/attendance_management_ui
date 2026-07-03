/**
 * actions/auth-server.action.ts
 *
 * These are the server actions that handle COOKIE management.
 * Separate from auth.action.ts because cookie writing needs
 * to happen in server actions (not in the plain service layer).
 *
 * Flow:
 *   Component calls loginServerAction
 *   → validates with Zod
 *   → calls authService.login
 *   → sets HttpOnly cookies via setAuthCookies
 *   → returns user data to client (client updates Zustand store)
 */

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authService } from "@/service/auth.service";
import { setAuthCookies, clearAuthCookies, getTokens } from "@/lib/server-auth";
import type { AppUserResponse } from "@/types/auth-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
  rememberMe: z.boolean().optional(),
});

export async function loginServerAction(
  formData: FormData
): Promise<ActionResult<AppUserResponse>> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    // 1. Get tokens from backend
    const auth = await authService.login(parsed.data);

    // 2. Write HttpOnly cookies (server-side, JS can't read these)
    await setAuthCookies(auth.accessToken, auth.refreshToken, parsed.data.rememberMe);

    // 3. Fetch user profile
    const user = await authService.getMe(auth.accessToken);

    // Return user to client so Zustand store can be updated
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutServerAction(): Promise<void> {
  const { refreshToken } = await getTokens();

  // Tell backend to invalidate the refresh token (best effort)
  if (refreshToken) {
    try {
      await authService.logout({ refreshToken });
    } catch {
      // Ignore — we still clear cookies even if backend fails
    }
  }

  await clearAuthCookies();
  redirect("/login");
}

// ─── Refresh token ────────────────────────────────────────────────────────────

/**
 * Called when an API request returns 401.
 * Tries to get a new access token using the refresh token.
 * Returns new accessToken or null if refresh also fails (user must re-login).
 */
export async function refreshTokenServerAction(): Promise<
  ActionResult<{ accessToken: string }>
> {
  const { refreshToken } = await getTokens();

  if (!refreshToken) {
    return { ok: false, error: "No refresh token" };
  }

  try {
    const auth = await authService.refresh({ refreshToken });
    await setAuthCookies(auth.accessToken, auth.refreshToken);
    return { ok: true, data: { accessToken: auth.accessToken } };
  } catch (e) {
    // Refresh failed — clear cookies and force re-login
    await clearAuthCookies();
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Change password ──────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "At least 8 characters"),
});

export async function changePasswordServerAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };

  try {
    await authService.changePassword(parsed.data, accessToken);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── Update profile ───────────────────────────────────────────────────────────

export async function updateProfileServerAction(
  formData: FormData
): Promise<ActionResult<AppUserResponse>> {
  const name = formData.get("name") as string;
  if (!name?.trim()) return { ok: false, error: "Name is required" };

  const { accessToken } = await getTokens();
  if (!accessToken) return { ok: false, error: "Not authenticated" };

  try {
    const user = await authService.updateMe(
      {
        name,
        phone: (formData.get("phone") as string) || undefined,
        avatar: (formData.get("avatar") as string) || undefined,
      },
      accessToken
    );
    return { ok: true, data: user };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}