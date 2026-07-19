/**
 * verify-otp-component.tsx
 *
 * Used after register → verify email.
 * The email comes from the URL: /verify-otp?email=john@gmail.com
 *
 * Flow:
 * 1. User enters 6-digit OTP from their email (validated with the shared otpSchema)
 * 2. verifyOtpAction is called
 * 3. On success → panels slide apart, then redirect to /login with a success hint
 * 4. "Resend" button calls resendOtpAction (60s cooldown to match backend rate limit)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheckIcon } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { otpSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import { setPendingVerification, getPendingVerification, clearPendingVerification } from "@/lib/pending-verification";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL, fall back to whatever was stashed on register
  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl ?? getPendingVerification() ?? "";

  // keep localStorage in sync (covers the case where only the URL has it)
  useEffect(() => {
    if (email) setPendingVerification(email);
  }, [email]);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // countdown ticker for the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOtpError("");

    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setOtpError(errors.otp);
      toastError(errors.otp ?? "Please check the code");
      return;
    }

    setLoading(true);
    const result = await verifyOtpAction(email, otp);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setLoading(false);
      return;
    }

    toastSuccess("Email verified", "You can now sign in.");
    clearPendingVerification();
    setSuccess(true); // triggers the split-open exit animation
    setTimeout(() => router.push("/login?verified=1"), AUTH_EXIT_DURATION * 1000);
  }

  async function handleResend() {
    if (resendLoading || cooldown > 0) return; // guard against double-clicks / spam

    setError("");
    setInfo("");
    setResendLoading(true);

    const result = await resendOtpAction(email);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
    } else {
      setInfo("A new code was sent to your email.");
      toastSuccess("Code resent", "Check your email.");
      setCooldown(RESEND_COOLDOWN_SECONDS); // matches backend @RateLimited window
    }
    setResendLoading(false);
  }

  function handleUseDifferentEmail() {
    clearPendingVerification();
    router.push("/register");
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      <AuthBrandPanel exiting={success} tagline="One more step — verify your email to activate your account." />

      {/* ─── Right panel: form ──────────────────────────────────────────── */}
      <motion.div
        animate={success ? { x: "100%" } : { x: 0 }}
        transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex flex-1 items-center justify-center bg-background px-6 py-16"
      >
        <div className="w-full max-w-sm space-y-6">
          <AuthMobileBrand />

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // digits only
                placeholder="123456"
                className={`${authInputClass} text-center text-2xl tracking-widest ${otpError ? "border-red-400" : ""}`}
                style={authInputRingStyle}
              />
              {otpError && <p className="text-xs text-red-500 mt-1 text-center">{otpError}</p>}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || success || otp.length !== 6}
              className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
              style={{ backgroundColor: AUTH_BRAND }}
            >
              {success ? "Verified!" : loading ? "Verifying…" : "Verify"}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
            className="w-full text-sm hover:underline disabled:opacity-50 disabled:hover:no-underline"
            style={{ color: AUTH_BRAND }}
          >
            {resendLoading
              ? "Sending…"
              : cooldown > 0
                ? `Resend code (${cooldown}s)`
                : "Resend code"}
          </button>

          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>
              <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
                Back to login
              </Link>
            </p>
            <p>
              Wrong email?{" "}
              <button
                onClick={handleUseDifferentEmail}
                className="hover:underline"
                style={{ color: AUTH_BRAND }}
              >
                Use a different email
              </button>
            </p>
          </div>
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
            <MailCheckIcon className="size-7" />
          </div>
          <p className="font-medium">Email verified</p>
        </motion.div>
      )}
    </div>
  );
}