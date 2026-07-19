"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { loginServerAction } from "@/actions/auth-server.action";
import { useAuthStore } from "@/store/auth.store";
import { toastSuccess, toastError } from "@/lib/toast";
import { loginSchema, fieldErrorsOf } from "@/schemas/auth.schema";
import {
  AuthBrandPanel, AuthMobileBrand, AUTH_BRAND, AUTH_EXIT_DURATION,
  authInputClass, authInputRingStyle,
} from "@/components/auth/auth-brand-panel";

export default function LoginComponent() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");

  

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
    setSuccess(true); // triggers the split-open exit animation

    setTimeout(() => router.push("/dashboard"), AUTH_EXIT_DURATION * 1000);
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
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              University Attendance System
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email or Student ID
              </label>
              <input
                name="identifier"
                type="text"
                placeholder="e.g. john@gmail.com"
                className={`${authInputClass} ${fieldErrors.identifier ? "border-red-400" : ""}`}
                style={authInputRingStyle}
              />
              {fieldErrors.identifier && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.identifier}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className={`${authInputClass} ${fieldErrors.password ? "border-red-400" : ""}`}
                style={authInputRingStyle}
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input name="rememberMe" type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                Remember me
              </label>
            </div>

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
              {success ? "Signed in!" : loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>
              <Link href="/forgot-password" className="hover:underline" style={{ color: AUTH_BRAND }}>
                Forgot password?
              </Link>
            </p>
            <p>
              No account?{" "}
              <Link href="/register" className="hover:underline" style={{ color: AUTH_BRAND }}>
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Success moment, fades in as the panels slide apart ──────────── */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
        >
          <div
            className="flex size-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{ backgroundColor: AUTH_BRAND }}
          >
            <CheckIcon className="size-7" />
          </div>
          <p className="font-medium">Welcome back, {name}</p>
        </motion.div>
      )}
    </div>
  );
}