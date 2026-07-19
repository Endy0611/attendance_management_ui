/**
 * register-component.tsx
 *
 * Flow:
 * 1. User fills name, email, password (+ optional phone)
 * 2. Validated client-side with the SAME registerSchema the server action uses
 *    (schemas/auth.schema.ts) — instant feedback, no round trip for typos
 * 3. registerAction is called → backend creates account + sends OTP email
 * 4. On success → panels slide apart, then redirect to /verify-otp?email=xxx
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MailCheckIcon } from "lucide-react";
import { registerAction } from "@/actions/auth.action";
import { registerSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import { toastSuccess, toastError } from "@/lib/toast";
import { setPendingVerification } from "@/lib/pending-verification";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

export default function RegisterComponent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    // Client-side zod check — same schema the server uses, so nothing here
    // can pass here and fail there (or vice versa).
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setFieldErrors(errors);
      toastError(Object.values(errors)[0] ?? "Please check the form");
      return;
    }

    setLoading(true);
    const result = await registerAction(formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setLoading(false);
      return;
    }

    toastSuccess("Account created", "Check your email for a verification code.");
    setEmail(result.data.email);
    setPendingVerification(result.data.email);
    setSuccess(true); // triggers the split-open exit animation

    setTimeout(() => {
      router.push(`/verify-otp?email=${encodeURIComponent(result.data.email)}`);
    }, AUTH_EXIT_DURATION * 1000);
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      <AuthBrandPanel exiting={success} />

      {/* ─── Right panel: form ──────────────────────────────────────────── */}
      <motion.div
        animate={success ? { x: "100%" } : { x: 0 }}
        transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex flex-1 items-center justify-center bg-background px-6 py-16"
      >
        <div className="w-full max-w-sm space-y-6">
          <AuthMobileBrand />

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We&apos;ll send a verification code to your email.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Full name" name="name" type="text" placeholder="John Doe" error={fieldErrors.name} />
            <Field label="Email" name="email" type="email" placeholder="john@example.com" error={fieldErrors.email} />
            <Field label="Phone (optional)" name="phone" type="tel" placeholder="+855 12 345 678" error={fieldErrors.phone} />
            <Field label="Password" name="password" type="password" placeholder="Min. 6 characters" error={fieldErrors.password} />
            <Field label="Confirm password" name="confirmPassword" type="password" placeholder="Same as above" error={fieldErrors.confirmPassword} />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full text-white rounded-lg py-2 text-sm font-medium transition disabled:opacity-60"
              style={{ backgroundColor: AUTH_BRAND }}
            >
              {success ? "Account created!" : loading ? "Creating account…" : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      {/* ─── Success moment, fades in as the panels slide apart ──────────── */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 text-center px-6"
        >
          <div
            className="flex size-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{ backgroundColor: AUTH_BRAND }}
          >
            <MailCheckIcon className="size-7" />
          </div>
          <p className="font-medium">Check your email</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            We sent a verification code to {email}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Small labeled input with inline zod error ───────────────────────────────

function Field({
  label, name, type, placeholder, error,
}: {
  label: string; name: string; type: string; placeholder: string; error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className={`${authInputClass} ${error ? "border-red-400" : ""}`}
        style={authInputRingStyle}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}