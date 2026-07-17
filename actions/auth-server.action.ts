/**
 * actions/auth-server.action.ts
 *
 * These are the server actions that handle COOKIE management.
 * Separate from auth.action.ts because cookie writing needs
 * to happen in server actions (not in the plain service layer).
 *
 * Flow:
 *   Component calls loginServerAction
 *   → validates with the shared Zod schemas (schemas/auth.schema.ts)
 *   → calls authService.login
 *   → sets HttpOnly cookies via setAuthCookies
 *   → returns user data to client (client updates Zustand store)
 *
 * Resilience: changePasswordServerAction and updateProfileServerAction both
 * retry once after a silent token refresh if the first attempt fails with a
 * 401 (expired) or 500 (some backends misreport an expired-JWT as a 500) —
 * so a stale access token doesn't surface as a confusing error to the user.
 */

"use server";

import { redirect } from "next/navigation";
import { authService } from "@/service/auth.service";
import { setAuthCookies, clearAuthCookies, getTokens } from "@/lib/server-auth";
import { ApiError, toFriendlyMessage } from "@/lib/api-error";
import type { AppUserResponse } from "@/types/auth-types";
import { loginSchema, changePasswordSchema } from "@/schemas/auth.schema";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isExpiredToken(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 500);
}

// ─── Login ────────────────────────────────────────────────────────────────────

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
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { ok: false, error: "Incorrect email/student ID or password" };
    }
    return { ok: false, error: toFriendlyMessage(err) };
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
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  try {
    const auth = await authService.refresh({ refreshToken });
    await setAuthCookies(auth.accessToken, auth.refreshToken);
    return { ok: true, data: { accessToken: auth.accessToken } };
  } catch {
    // Refresh failed — clear cookies and force re-login
    await clearAuthCookies();
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
}

// ─── Change password ──────────────────────────────────────────────────────────

export async function changePasswordServerAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  // confirmPassword never leaves this action — the backend only wants the two
  const { currentPassword, newPassword } = parsed.data;

  try {
    await authService.changePassword({ currentPassword, newPassword }, accessToken);
    return { ok: true, data: undefined };
  } catch (err) {
    if (!isExpiredToken(err) || !refreshToken) {
      return { ok: false, error: toFriendlyMessage(err) };
    }
    // Access token had expired — refresh once, then retry the real request
    try {
      const auth = await authService.refresh({ refreshToken });
      await setAuthCookies(auth.accessToken, auth.refreshToken);
      await authService.changePassword({ currentPassword, newPassword }, auth.accessToken);
      return { ok: true, data: undefined };
    } catch (retryErr) {
      return { ok: false, error: toFriendlyMessage(retryErr) };
    }
  }
}

// ─── Update profile ───────────────────────────────────────────────────────────

export async function updateProfileServerAction(
  formData: FormData
): Promise<ActionResult<AppUserResponse>> {
  const name = formData.get("name") as string;
  if (!name?.trim()) return { ok: false, error: "Please enter your name" };

  const rawPhone = (formData.get("phone") as string) ?? "";
  const rawAvatar = (formData.get("avatar") as string) ?? "";

  // 1. Clean phone input formatting — strip whitespace, drop a leading 0
  //    (local format like "012 345 678" → "12345678" for the backend)
  let sanitizedPhone = rawPhone.replace(/\s+/g, "");
  if (sanitizedPhone.startsWith("0")) {
    sanitizedPhone = sanitizedPhone.slice(1);
  }

  // 2. The avatar field may be a full preview-file URL (from the file upload
  //    flow) — extract just the storage `key` so we save that, not the URL
  let sanitizedAvatar = rawAvatar.trim();
  if (sanitizedAvatar.includes("key=")) {
    try {
      if (sanitizedAvatar.startsWith("http")) {
        const keyParam = new URL(sanitizedAvatar).searchParams.get("key");
        if (keyParam) sanitizedAvatar = keyParam;
      } else {
        const match = sanitizedAvatar.match(/key=([^&]+)/);
        if (match?.[1]) sanitizedAvatar = match[1];
      }
    } catch {
      // Malformed URL — fall back to whatever was typed/pasted in as-is
    }
  }

  const payload = {
    name: name.trim(),
    phone: sanitizedPhone.trim(),
    avatar: sanitizedAvatar.trim(),
  };

  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  try {
    const user = await authService.updateMe(payload, accessToken);
    return { ok: true, data: user };
  } catch (err) {
    if (!isExpiredToken(err) || !refreshToken) {
      return { ok: false, error: toFriendlyMessage(err) };
    }
    try {
      const auth = await authService.refresh({ refreshToken });
      await setAuthCookies(auth.accessToken, auth.refreshToken);
      const user = await authService.updateMe(payload, auth.accessToken);
      return { ok: true, data: user };
    } catch (retryErr) {
      return { ok: false, error: toFriendlyMessage(retryErr) };
    }
  }
}