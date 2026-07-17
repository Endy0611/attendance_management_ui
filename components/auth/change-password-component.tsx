/**
 * components/auth/change-password-component.tsx
 *
 * For logged-in users who want to change their password.
 * Different from reset-password (which uses a token from email).
 *
 * Flow:
 * 1. User enters current password + new password + confirm
 * 2. Validated client-side with the shared changePasswordSchema
 * 3. changePasswordServerAction is called (reads token from cookie server-side)
 * 4. On success → panels slide apart + a "Continue to dashboard" button
 *    (no auto-redirect here — unlike login/register/otp, this isn't a
 *    first-time gate, so the user should choose when to leave)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { changePasswordServerAction } from "@/actions/auth-server.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { changePasswordSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

export default function ChangePasswordComponent() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setFieldErrors(errors);
      toastError(Object.values(errors)[0] ?? "Please check the form");
      return;
    }

    setLoading(true);
    const result = await changePasswordServerAction(formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setLoading(false);
      return;
    }

    toastSuccess("Password changed");
    setSuccess(true); // triggers the split-open animation; user clicks through manually
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      <AuthBrandPanel exiting={success} tagline="Keeping your account secure — one strong password at a time." />

      {/* ─── Right panel: form or success ───────────────────────────────── */}
      <motion.div
        animate={success ? { x: "100%" } : { x: 0 }}
        transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex flex-1 items-center justify-center bg-background px-6 py-16"
      >
        {success ? (
          <div className="w-full max-w-sm space-y-6 text-center">
            <div
              className="mx-auto flex size-14 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: AUTH_BRAND }}
            >
              <CheckIcon className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Password changed</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your password has been updated successfully.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full text-white rounded-lg py-2 text-sm font-medium transition"
              style={{ backgroundColor: AUTH_BRAND }}
            >
              Continue to dashboard
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-6">
            <AuthMobileBrand />

            <div>
              <h2 className="text-2xl font-bold tracking-tight">Change password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your current password to set a new one.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current password</label>
                <input
                  name="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`${authInputClass} ${fieldErrors.currentPassword ? "border-red-400" : ""}`}
                  style={authInputRingStyle}
                />
                {fieldErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New password</label>
                <input
                  name="newPassword"
                  type="password"
                  placeholder="Min. 8 characters"
                  className={`${authInputClass} ${fieldErrors.newPassword ? "border-red-400" : ""}`}
                  style={authInputRingStyle}
                />
                {fieldErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm new password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Same as above"
                  className={`${authInputClass} ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
                  style={authInputRingStyle}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
                style={{ backgroundColor: AUTH_BRAND }}
              >
                {loading ? "Saving…" : "Update password"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:underline" style={{ color: AUTH_BRAND }}>
                Cancel
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}