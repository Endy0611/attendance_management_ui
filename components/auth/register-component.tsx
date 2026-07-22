// register-component.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheckIcon, UserIcon, MailIcon, PhoneIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { registerAction } from "@/actions/auth.action";
import { registerSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import { toastSuccess, toastError } from "@/lib/toast";
import { setPendingVerification } from "@/lib/pending-verification";
import {
  AuthBrandPanel, AuthCard, AuthMobileBrand, AUTH_BRAND, AUTH_BRAND_LIGHT, AUTH_BRAND_DEEP, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function RegisterComponent() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

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
    setSuccess(true); // triggers the in-card morph

    setTimeout(() => {
      router.push(`/verify-otp?email=${encodeURIComponent(result.data.email)}`);
    }, AUTH_EXIT_DURATION * 1000);
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
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-6"
            >
              <motion.div variants={fieldVariants}>
                <AuthMobileBrand />
              </motion.div>

              <motion.div variants={fieldVariants} className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Create account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We&apos;ll send a verification code to your email.
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <motion.div variants={fieldVariants}>
                  <IconField icon={UserIcon} name="name" type="text" placeholder="John Doe" error={fieldErrors.name} />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <IconField icon={MailIcon} name="email" type="email" placeholder="john@example.com" error={fieldErrors.email} />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <IconField icon={PhoneIcon} name="phone" type="tel" placeholder="+855 12 345 678 (optional)" error={fieldErrors.phone} />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <IconField
                    icon={LockIcon}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    error={fieldErrors.password}
                    toggle={{ shown: showPassword, onToggle: () => setShowPassword((v) => !v) }}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <IconField
                    icon={LockIcon}
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Same as above"
                    error={fieldErrors.confirmPassword}
                    toggle={{ shown: showConfirmPassword, onToggle: () => setShowConfirmPassword((v) => !v) }}
                  />
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
                </AnimatePresence>

                <motion.button
                  variants={fieldVariants}
                  type="submit"
                  disabled={loading}
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
                  <span className="relative">{loading ? "Creating account…" : "Register"}</span>
                </motion.button>
              </form>

              <motion.p variants={fieldVariants} className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="hover:underline" style={{ color: AUTH_BRAND }}>
                  Sign in
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
                <MailCheckIcon className="size-8 sm:size-10" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <p className="text-lg font-semibold">Check your email</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  We sent a verification code to {email}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}

// ─── Icon-prefixed input with inline zod error + optional show/hide toggle ──

function IconField({
  icon: Icon, name, type, placeholder, error, toggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string; type: string; placeholder: string; error?: string;
  toggle?: { shown: boolean; onToggle: () => void };
}) {
  return (
    <div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          className={`${authInputClass} pl-9 ${toggle ? "pr-9" : ""} ${error ? "border-red-400" : ""}`}
          style={authInputRingStyle}
        />
        {toggle && (
          <button
            type="button"
            onClick={toggle.onToggle}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {toggle.shown ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}