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
 * 4. "Resend" button calls resendOtpAction
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter} from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheckIcon } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { otpSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

export default function VerifyOtpComponent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);

 useEffect(() => {
   const pending = localStorage.getItem("pendingVerification");

   if (!pending) {
     router.replace("/register");
     return;
   }

   const { email } = JSON.parse(pending);

   setEmail(email);
 }, [router]);
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

// Remove pending verification email
localStorage.removeItem("pendingVerification");

setSuccess(true);

setTimeout(() => {
  router.push("/login?verified=1");
}, AUTH_EXIT_DURATION * 1000);
  }

  async function handleResend() {
    setError("");
    setInfo("Sending…");

    if (!email) {
  toastError("Email not found.");
  return;
}

const result = await resendOtpAction(email);
    setInfo(result.ok ? "A new code was sent to your email." : "");
    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
    } else {
      toastSuccess("Code resent", "Check your email.");
    }
  }

  if (!email) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
            className="w-full text-sm hover:underline"
            style={{ color: AUTH_BRAND }}
          >
            Resend code
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <button
  type="button"
  onClick={() => toastError("Please verify your email first.")}
  className="hover:underline"
  style={{ color: AUTH_BRAND }}
>
  Back to login
</button>
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
            <MailCheckIcon className="size-7" />
          </div>
          <p className="font-medium">Email verified</p>
        </motion.div>
      )}
    </div>
  );
}