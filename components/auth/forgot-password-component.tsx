// forgot-password-component.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRoundIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import {
  forgotPasswordAction,
  verifyForgotPasswordAction,
  resetPasswordAction,
} from "@/actions/auth.action";
import { toastSuccess, toastError } from "@/lib/toast";
import { forgotPasswordSchema, otpSchema, resetPasswordSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthCard, AuthMobileBrand, AUTH_BRAND, AUTH_BRAND_LIGHT, AUTH_BRAND_DEEP, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

type Step = 1 | 2 | 3;

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const STEP_COPY: Record<Step, { title: string; subtitle: string }> = {
  1: { title: "Forgot password", subtitle: "Enter your Gmail and we'll send a reset code." },
  2: { title: "Enter code", subtitle: "Check your inbox for the 6-digit code." },
  3: { title: "New password", subtitle: "Choose a strong password (min. 8 chars)." },
};

function GradientButton({
  disabled, loading, children,
}: { disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <motion.button
      variants={fieldVariants}
      type="submit"
      disabled={disabled}
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
      <span className="relative">{children}</span>
    </motion.button>
  );
}

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      toastError(errors.otp ?? "Please check the code");
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
    setSuccess(true); // triggers the in-card morph
    setTimeout(() => router.push("/login?reset=1"), AUTH_EXIT_DURATION * 1000);
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

              {/* Step indicator */}
              <motion.div variants={fieldVariants} className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${AUTH_BRAND_LIGHT}, ${AUTH_BRAND_DEEP})` }}
                      initial={false}
                      animate={{ width: s <= step ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                ))}
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{STEP_COPY[step].title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step === 2 ? (
                        <>Code sent to <span className="font-medium text-foreground">{email}</span></>
                      ) : (
                        STEP_COPY[step].subtitle
                      )}
                    </p>
                  </div>

                  {/* ── Step 1 ── */}
                  {step === 1 && (
                    <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                      <div>
                        <div className="relative">
                          <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                          <input
                            name="email"
                            type="email"
                            placeholder="you@gmail.com"
                            className={`${authInputClass} pl-9 ${fieldErrors.email ? "border-red-400" : ""}`}
                            style={authInputRingStyle}
                          />
                        </div>
                        {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                      </div>

                      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                      <GradientButton disabled={loading} loading={loading}>
                        {loading ? "Sending…" : "Send code"}
                      </GradientButton>
                    </form>
                  )}

                  {/* ── Step 2 ── */}
                  {step === 2 && (
                    <>
                      <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className={`${authInputClass} text-center text-2xl tracking-[0.4em] font-mono ${fieldErrors.otp ? "border-red-400" : ""}`}
                            style={authInputRingStyle}
                          />
                          {fieldErrors.otp && <p className="text-xs text-red-500 mt-1 text-center">{fieldErrors.otp}</p>}
                        </div>

                        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                        <GradientButton disabled={loading || otp.length !== 6} loading={loading}>
                          {loading ? "Verifying…" : "Verify code"}
                        </GradientButton>
                      </form>

                      <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:underline">
                        ← Back
                      </button>
                    </>
                  )}

                  {/* ── Step 3 ── */}
                  {step === 3 && (
                    <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                      <div>
                        <div className="relative">
                          <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                          <input
                            name="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New password"
                            className={`${authInputClass} pl-9 pr-9 ${fieldErrors.newPassword ? "border-red-400" : ""}`}
                            style={authInputRingStyle}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                        {fieldErrors.newPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.newPassword}</p>}
                      </div>

                      <div>
                        <div className="relative">
                          <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                          <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            className={`${authInputClass} pl-9 pr-9 ${fieldErrors.confirmPassword ? "border-red-400" : ""}`}
                            style={authInputRingStyle}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            tabIndex={-1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                          </button>
                        </div>
                        {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
                      </div>

                      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

                      <GradientButton disabled={loading} loading={loading}>
                        {loading ? "Saving…" : "Reset password"}
                      </GradientButton>
                    </form>
                  )}
                </motion.div>
              </AnimatePresence>

              <motion.p variants={fieldVariants} className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
                  Back to login
                </Link>
              </motion.p>
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
                <KeyRoundIcon className="size-8 sm:size-10" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <p className="text-lg font-semibold">Password reset</p>
                <p className="text-sm text-muted-foreground mt-1">Taking you to sign in…</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}