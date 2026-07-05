"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authService } from "@/service/auth.service";
import { setAuthCookies, clearAuthCookies, getTokens } from "@/lib/server-auth";
import { ApiError, toFriendlyMessage } from "@/lib/api-error";
import type { AppUserResponse } from "@/types/auth-types";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function isExpiredToken(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 500);
}

// ─── Login ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or student ID"),
  password: z.string().min(1, "Please enter your password"),
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
    const auth = await authService.login(parsed.data);
    await setAuthCookies(auth.accessToken, auth.refreshToken, parsed.data.rememberMe);
    const user = await authService.getMe(auth.accessToken);
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
  if (refreshToken) {
    try {
      await authService.logout({ refreshToken });
    } catch {}
  }
  await clearAuthCookies();
  redirect("/login");
}

// ─── Refresh token ────────────────────────────────────────────────────────────

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
    await clearAuthCookies();
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }
}

// ─── Change password ──────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Please enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
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

  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  try {
    await authService.changePassword(parsed.data, accessToken);
    return { ok: true, data: undefined };
  } catch (err) {
    if (!isExpiredToken(err) || !refreshToken) {
      return { ok: false, error: toFriendlyMessage(err) };
    }
    try {
      const auth = await authService.refresh({ refreshToken });
      await setAuthCookies(auth.accessToken, auth.refreshToken);
      await authService.changePassword(parsed.data, auth.accessToken);
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

  const rawPhone = formData.get("phone") as string;
  const rawAvatar = formData.get("avatar") as string;

  // 1. Clean phone input formatting
  let sanitizedPhone = rawPhone ? rawPhone.replace(/\s+/g, "") : "";
  if (sanitizedPhone.startsWith("0")) {
    sanitizedPhone = sanitizedPhone.slice(1);
  }

  // 2. Extract key from image preview link paths
  let sanitizedAvatar = rawAvatar?.trim() || "";
  if (sanitizedAvatar.includes("key=")) {
    try {
      if (sanitizedAvatar.startsWith("http")) {
        const urlObj = new URL(sanitizedAvatar);
        const keyParam = urlObj.searchParams.get("key");
        if (keyParam) sanitizedAvatar = keyParam;
      } else {
        const matches = sanitizedAvatar.match(/key=([^&]+)/);
        if (matches && matches[1]) sanitizedAvatar = matches[1];
      }
    } catch (e) {}
  }

  // 3. Assemble explicit string properties to strictly fulfill model bindings
  const payload = {
    name: name.trim(),
    phone: sanitizedPhone.trim() !== "" ? sanitizedPhone.trim() : "",
    avatar: sanitizedAvatar.trim() !== "" ? sanitizedAvatar.trim() : ""
  };

  console.log("[updateProfileServerAction] Target payload:", JSON.stringify(payload));

  const { accessToken, refreshToken } = await getTokens();
  if (!accessToken) {
    return { ok: false, error: "Your session has expired. Please sign in again." };
  }

  try {
    const user = await authService.updateMe(payload as any, accessToken);
    return { ok: true, data: user };
  } catch (err) {
    if (!isExpiredToken(err) || !refreshToken) {
      return { ok: false, error: toFriendlyMessage(err) };
    }
    try {
      const auth = await authService.refresh({ refreshToken });
      await setAuthCookies(auth.accessToken, auth.refreshToken);
      const user = await authService.updateMe(payload as any, auth.accessToken);
      return { ok: true, data: user };
    } catch (retryErr) {
      return { ok: false, error: toFriendlyMessage(retryErr) };
    }
  }
}