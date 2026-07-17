/**
 * forgot-password-component.tsx
 *
 * 3-step flow all in one component:
 *   Step 1 → Enter Gmail address → receive OTP
 *   Step 2 → Enter OTP → receive resetToken (string from server)
 *   Step 3 → Enter new password with resetToken → panels slide apart → /login
 *
 * Why one component?  Simpler to share state (email, resetToken) between steps
 * without needing URL params or extra pages.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRoundIcon } from "lucide-react";
import {
  forgotPasswordAction,
  verifyForgotPasswordAction,
  resetPasswordAction,
} from "@/actions/auth.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { forgotPasswordSchema, otpSchema, resetPasswordSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

type Step = 1 | 2 | 3;

export default function ForgotPasswordComponent() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setFieldErrors(errors);
      toastError(Object.values(errors)[0] ?? "Please check the form");
      return;
    }

    setLoading(true);
    const result = await forgotPasswordAction(formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
    } else {
      toastSuccess("Code sent", "Check your email for the reset code.");
      setEmail(parsed.data.email);
      setStep(2);
    }

    setLoading(false);
  }

  // ── Step 2: Verify OTP → get resetToken ───────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setFieldErrors(errors);
      toastError(Object.values(errors)[0] ?? "Please check the code");
      return;
    }

    setLoading(true);
    const result = await verifyForgotPasswordAction(email, otp);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
    } else {
      toastSuccess("Code verified");
      setResetToken(result.data); // server returns a string token
      setStep(3);
    }

    setLoading(false);
  }

  // ── Step 3: Reset password ────────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
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
    const result = await resetPasswordAction(resetToken, formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setLoading(false);
      return;
    }

    toastSuccess("Password reset", "You can now sign in with your new password.");
    setSuccess(true); // triggers the split-open exit animation
    setTimeout(() => router.push("/login?reset=1"), AUTH_EXIT_DURATION * 1000);
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      <AuthBrandPanel exiting={success} tagline="Forgot your password? A few quick steps and you're back in." />

      {/* ─── Right panel: steps ─────────────────────────────────────────── */}
      <motion.div
        animate={success ? { x: "100%" } : { x: 0 }}
        transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex flex-1 items-center justify-center bg-background px-6 py-16"
      >
        <div className="w-full max-w-sm space-y-6">
          <AuthMobileBrand />

          {/* Step indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s > step ? "bg-muted" : ""}`}
                style={{ backgroundColor: s <= step ? AUTH_BRAND : undefined }}
              />
            ))}
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Forgot password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your Gmail and we&apos;ll send a reset code.
                </p>
              </div>

              <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                <div>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@gmail.com"
                    className={`${authInputClass} ${fieldErrors.email ? "border-red-400" : ""}`}
                    style={authInputRingStyle}
                  />
                  {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
                  style={{ backgroundColor: AUTH_BRAND }}
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Enter code</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className={`${authInputClass} text-center text-2xl tracking-widest ${fieldErrors.otp ? "border-red-400" : ""}`}
                    style={authInputRingStyle}
                  />
                  {fieldErrors.otp && <p className="text-xs text-red-500 mt-1 text-center">{fieldErrors.otp}</p>}
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
                  style={{ backgroundColor: AUTH_BRAND }}
                >
                  {loading ? "Verifying…" : "Verify code"}
                </button>
              </form>

              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:underline">
                ← Back
              </button>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">New password</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password (min. 8 chars).</p>
              </div>

              <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                <div>
                  <input
                    name="newPassword"
                    type="password"
                    placeholder="New password"
                    className={`${authInputClass} ${fieldErrors.newPassword ? "border-red-400" : ""}`}
                    style={authInputRingStyle}
                  />
                  {fieldErrors.newPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.newPassword}</p>}
                </div>
                <div>
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    className={`${authInputClass} ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
                    style={authInputRingStyle}
                  />
                  {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
                  style={{ backgroundColor: AUTH_BRAND }}
                >
                  {success ? "Password reset!" : loading ? "Saving…" : "Reset password"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
              Back to login
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ─── Success moment ─────────────────────────────────────────────── */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
        >
          <div className="flex size-14 items-center justify-center rounded-full text-white shadow-lg" style={{ backgroundColor: AUTH_BRAND }}>
            <KeyRoundIcon className="size-7" />
          </div>
          <p className="font-medium">Password reset</p>
        </motion.div>
      )}
    </div>
  );
}