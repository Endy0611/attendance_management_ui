// verify-otp-component.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheckIcon } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { otpSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import { setPendingVerification, getPendingVerification, clearPendingVerification } from "@/lib/pending-verification";
import {
  AuthBrandPanel, AuthCard, AuthMobileBrand, AUTH_BRAND, AUTH_BRAND_LIGHT, AUTH_BRAND_DEEP, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

const RESEND_COOLDOWN_SECONDS = 60;

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function VerifyOtpComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email");
  const email = emailFromUrl ?? getPendingVerification() ?? "";

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
    setSuccess(true); // triggers the in-card morph
    setTimeout(() => router.push("/login?verified=1"), AUTH_EXIT_DURATION * 1000);
  }

  async function handleResend() {
    if (resendLoading || cooldown > 0) return;

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
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
    setResendLoading(false);
  }

  function handleUseDifferentEmail() {
    clearPendingVerification();
    router.push("/register");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 sm:py-16">
      <AuthBrandPanel exiting={success} />

      <AuthCard>
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, scale: 0.97 }}
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="space-y-6"
            >
              <motion.div variants={fieldVariants}>
                <AuthMobileBrand />
              </motion.div>

              <motion.div variants={fieldVariants} className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Verify your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </motion.div>

              <form onSubmit={handleVerify} noValidate className="space-y-4">
                <motion.div variants={fieldVariants}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className={`${authInputClass} text-center text-2xl tracking-[0.4em] font-mono ${otpError ? "border-red-400" : ""}`}
                    style={authInputRingStyle}
                  />
                  {otpError && <p className="text-xs text-red-500 mt-1 text-center">{otpError}</p>}
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 overflow-hidden"
                    >
                      {error}
                    </motion.p>
                  )}
                  {info && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 overflow-hidden"
                    >
                      {info}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  variants={fieldVariants}
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full overflow-hidden rounded-xl py-2.5 sm:py-3 text-sm font-medium text-white shadow-md transition disabled:opacity-70"
                  style={{ background: `linear-gradient(135deg, ${AUTH_BRAND_LIGHT}, ${AUTH_BRAND_DEEP})` }}
                >
                  {loading && (
                    <motion.span
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)" }}
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                    />
                  )}
                  <span className="relative">{loading ? "Verifying…" : "Verify"}</span>
                </motion.button>
              </form>

              <motion.button
                variants={fieldVariants}
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                className="w-full text-sm hover:underline disabled:opacity-50 disabled:hover:no-underline"
                style={{ color: AUTH_BRAND }}
              >
                {resendLoading ? "Sending…" : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </motion.button>

              <motion.div variants={fieldVariants} className="text-center space-y-2 text-sm text-muted-foreground">
                <p>
                  <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
                    Back to login
                  </Link>
                </p>
                <p>
                  Wrong email?{" "}
                  <button onClick={handleUseDifferentEmail} className="hover:underline" style={{ color: AUTH_BRAND }}>
                    Use a different email
                  </button>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="flex size-16 sm:size-20 items-center justify-center rounded-full text-white"
                style={{
                  background: `linear-gradient(135deg, ${AUTH_BRAND_LIGHT}, ${AUTH_BRAND_DEEP})`,
                  boxShadow: `0 0 40px -6px ${AUTH_BRAND}`,
                }}
              >
                <MailCheckIcon className="size-8 sm:size-10" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <p className="text-lg font-semibold">Email verified</p>
                <p className="text-sm text-muted-foreground mt-1">Taking you to sign in…</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}