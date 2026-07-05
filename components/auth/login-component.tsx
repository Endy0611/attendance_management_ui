"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck2Icon, ScanFaceIcon, MapPinIcon, SmartphoneIcon, CheckIcon } from "lucide-react";
import { loginServerAction } from "@/actions/auth-server.action";
import { useAuthStore } from "@/store/auth.store";
import { toastSuccess, toastError } from "@/lib/toast";

const BRAND = "#1C4D8D";
const EXIT_DURATION = 0.7; // seconds — must match the setTimeout below

export default function LoginComponent() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

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
    setSuccess(true); // triggers the split-open exit animation below

    // Navigate once the panels have finished sliding apart
    setTimeout(() => router.push("/dashboard"), EXIT_DURATION * 1000);
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col md:flex-row bg-background">
      {/* ─── Left panel: brand ──────────────────────────────────────────── */}
      <motion.div
        animate={success ? { x: "-100%" } : { x: 0 }}
        transition={{ duration: EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative hidden md:flex md:w-1/2 items-center justify-center overflow-hidden text-white"
        style={{ backgroundColor: BRAND }}
      >
        {/* Decorative rotating rings, same motif as the landing page hero */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden">
          <div className="size-[28rem] rounded-full border border-dashed border-white/15 animate-[spin_30s_linear_infinite]" />
          <div className="absolute size-[20rem] rounded-full border border-dashed border-white/15 animate-[spin-reverse_22s_linear_infinite]" />
        </div>

        <div className="relative z-10 max-w-sm px-10 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <CalendarCheck2Icon className="size-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">ICheck</h1>
          <p className="mt-2 text-white/75">
            Smart campus attendance — your face, your location, your device,
            checked together.
          </p>

          <div className="mt-10 flex items-center justify-center gap-6 text-white/60">
            <ScanFaceIcon className="size-5" />
            <MapPinIcon className="size-5" />
            <SmartphoneIcon className="size-5" />
          </div>
        </div>

        <style>{`
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
        `}</style>
      </motion.div>

      {/* ─── Right panel: form ──────────────────────────────────────────── */}
      <motion.div
        animate={success ? { x: "100%" } : { x: 0 }}
        transition={{ duration: EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
        className="relative flex flex-1 items-center justify-center bg-background px-6 py-16"
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Brand mark for mobile, where the left panel is hidden */}
          <div className="flex md:hidden items-center gap-2.5 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: BRAND }}>
              <CalendarCheck2Icon className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">ICheck</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              University Attendance System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email or Student ID
              </label>
              <input
                name="identifier"
                type="text"
                required
                placeholder="e.g. john@gmail.com"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 transition-shadow"
                style={{ ["--tw-ring-color" as string]: `${BRAND}4D` }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 transition-shadow"
                style={{ ["--tw-ring-color" as string]: `${BRAND}4D` }}
              />
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
              style={{ backgroundColor: BRAND }}
            >
              {success ? "Signed in!" : loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p>
              <Link href="/forgot-password" className="hover:underline" style={{ color: BRAND }}>
                Forgot password?
              </Link>
            </p>
            <p>
              No account?{" "}
              <Link href="/register" className="hover:underline" style={{ color: BRAND }}>
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
            style={{ backgroundColor: BRAND }}
          >
            <CheckIcon className="size-7" />
          </div>
          <p className="font-medium">Welcome back, {name}</p>
        </motion.div>
      )}
    </div>
  );
}