/**
 * auth.action.ts
 *
 * Next.js Server Actions — run on the server, called from client components.
 * They validate input with Zod before calling the service.
 *
 * Why server actions instead of calling the service directly from the client?
 * → API calls stay server-side (your backend URL never leaks to the browser).
 * → Easy to add rate-limiting, logging, or cookies later.
 *
 * Error messages returned to the client always go through
 * toFriendlyMessage() — the real status/backend message is logged
 * server-side (see auth.service.ts) but never shown to the user directly.
 */

"use server";

import { z } from "zod";
import { authService } from "@/service/auth.service";
import { ApiError, toFriendlyMessage } from "@/lib/api-error";

// ─── Zod schemas (validation rules) ─────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or student ID is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

const forgotSchema = z.object({
  email: z
    .string()
    .email()
    .regex(/^[a-z0-9._%+-]+@gmail\.com$/, "Must be a Gmail address"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// ─── Action result shape ─────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function loginAction(
  formData: FormData
): Promise<ActionResult<{ accessToken: string; refreshToken: string; firstLogin: boolean }>> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    const data = await authService.login(parsed.data);
    return { ok: true, data };
  } catch (err) {
    // 401 here means "wrong credentials", not "expired session".
    if (err instanceof ApiError && err.status === 401) {
      return { ok: false, error: "Incorrect email/student ID or password" };
    }
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function registerAction(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await authService.register(parsed.data);
    // After register, backend sends OTP to email for verification
    return { ok: true, data: { email: parsed.data.email } };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function verifyOtpAction(
  email: string,
  otp: string
): Promise<ActionResult> {
  if (otp.length !== 6) return { ok: false, error: "OTP must be 6 digits" };

  try {
    await authService.verifyOtp(email, otp);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function resendOtpAction(email: string): Promise<ActionResult> {
  try {
    await authService.resendOtp(email);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await authService.forgotPassword(parsed.data);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function verifyForgotPasswordAction(
  email: string,
  otp: string
): Promise<ActionResult<string>> {
  try {
    const resetToken = await authService.verifyForgotPassword({ email, otp });
    return { ok: true, data: resetToken };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function resetPasswordAction(
  resetToken: string,
  formData: FormData
): Promise<ActionResult> {
  const newPassword = formData.get("newPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  try {
    await authService.resetPassword({ resetToken, newPassword });
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}

export async function changePasswordAction(
  token: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await authService.changePassword(parsed.data, token);
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: toFriendlyMessage(err) };
  }
}