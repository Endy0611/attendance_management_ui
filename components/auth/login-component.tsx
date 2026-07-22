// login-component.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { loginServerAction } from "@/actions/auth-server.action";
import { useAuthStore } from "@/store/auth.store";
import { toastSuccess, toastError } from "@/lib/toast";
import { loginSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthCard, AuthMobileBrand, AUTH_BRAND, AUTH_BRAND_LIGHT, AUTH_BRAND_DEEP, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function LoginComponent() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    const parsed = loginSchema.safeParse({
      identifier: formData.get("identifier"),
      password: formData.get("password"),
      rememberMe: formData.get("rememberMe") === "on",
    });

    if (!parsed.success) {
      const errors = fieldErrorsOf(parsed.error);
      setFieldErrors(errors);
      toastError(Object.values(errors)[0] ?? "Please check the form");
      return;
    }

    setLoading(true);

    // loginServerAction: calls backend, sets HttpOnly cookie, returns user
    const result = await loginServerAction(formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setLoading(false);
      return;
    }

    // Save user to Zustand so client components can read name/role/avatar
    // Tokens are in the HttpOnly cookie — Zustand only holds the user object
    setAuth(
      { accessToken: "", refreshToken: "" }, // tokens are cookie-only
      result.data,
    );

    toastSuccess(`Welcome back, ${result.data.name}`);
    setName(result.data.name);
    setSuccess(true); // triggers the in-card morph

    setTimeout(() => router.push("/dashboard"), AUTH_EXIT_DURATION * 1000);
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
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  University Attendance System
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <motion.div variants={fieldVariants}>
                  <label className="block text-sm font-medium mb-1">
                    Email or Student ID
                  </label>
                  <div className="relative">
                    <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      name="identifier"
                      type="text"
                      placeholder="e.g. john@gmail.com"
                      className={`${authInputClass} pl-9 ${fieldErrors.identifier ? "border-red-400" : ""}`}
                      style={authInputRingStyle}
                    />
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.identifier}</p>
                  )}
                </motion.div>

                <motion.div variants={fieldVariants}>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`${authInputClass} pl-9 pr-9 ${fieldErrors.password ? "border-red-400" : ""}`}
                      style={authInputRingStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  )}
                </motion.div>

                <motion.div variants={fieldVariants} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input name="rememberMe" type="checkbox" id="rememberMe" />
                    <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: AUTH_BRAND }}>
                    Forgot password?
                  </Link>
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
                  <span className="relative">{loading ? "Signing in…" : "Sign in"}</span>
                </motion.button>
              </form>

              <motion.div variants={fieldVariants} className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/register" className="hover:underline" style={{ color: AUTH_BRAND }}>
                  Register
                </Link>
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
                <CheckIcon className="size-8 sm:size-10" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <p className="text-lg font-semibold">Welcome back, {name}</p>
                <p className="text-sm text-muted-foreground mt-1">Taking you to your dashboard…</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}