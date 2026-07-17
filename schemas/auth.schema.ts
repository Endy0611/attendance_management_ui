/**
 * schemas/auth.schema.ts
 *
 * Shared Zod schemas for every auth flow. No "use server" here — this is a
 * plain module so it can be imported from:
 *   - Server actions (actions/auth.action.ts, actions/auth-server.action.ts)
 *   - Client components (for instant field-level errors, before hitting the server)
 *
 * Keeping schemas here means the client and server can never validate a form
 * differently — there's exactly one definition of "a valid password" etc.
 */

import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or student ID"),
  password: z.string().min(1, "Please enter your password"),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, "Please enter your name"),
    email: z.email("Please enter a valid email"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .regex(/^[a-z0-9._%+-]+@gmail\.com$/i, "Must be a Gmail address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Please enter the 6-digit code")
    .regex(/^\d+$/, "Code must be digits only"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Flattens a failed safeParse into a simple { fieldName: message } map for form UIs. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}