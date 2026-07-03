/**
 * forgot-password-component.tsx
 *
 * 3-step flow all in one component:
 *   Step 1 → Enter Gmail address → receive OTP
 *   Step 2 → Enter OTP → receive resetToken (string from server)
 *   Step 3 → Enter new password with resetToken → redirect to /login
 *
 * Why one component?  Simpler to share state (email, resetToken) between steps
 * without needing URL params or extra pages.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  forgotPasswordAction,
  verifyForgotPasswordAction,
  resetPasswordAction,
} from "@/actions/auth.action";

type Step = 1 | 2 | 3;

export default function ForgotPasswordComponent() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await forgotPasswordAction(formData);

    if (!result.ok) {
      setError(result.error);
    } else {
      setEmail(formData.get("email") as string);
      setStep(2);
    }

    setLoading(false);
  }

  // ── Step 2: Verify OTP → get resetToken ───────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verifyForgotPasswordAction(email, otp);

    if (!result.ok) {
      setError(result.error);
    } else {
      setResetToken(result.data); // server returns a string token
      setStep(3);
    }

    setLoading(false);
  }

  // ── Step 3: Reset password ────────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await resetPasswordAction(resetToken, formData);

    if (!result.ok) {
      setError(result.error);
    } else {
      router.push("/login?reset=1");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">

        {/* Step indicator */}
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
              <p className="text-sm text-gray-500 mt-1">
                Enter your Gmail and we'll send a reset code.
              </p>
            </div>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="you@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
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
              <h1 className="text-2xl font-bold text-gray-900">Enter code</h1>
              <p className="text-sm text-gray-500 mt-1">
                Code sent to <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Verifying…" : "Verify code"}
              </button>
            </form>

            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:underline">
              ← Back
            </button>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New password</h1>
              <p className="text-sm text-gray-500 mt-1">Choose a strong password (min. 8 chars).</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                name="newPassword"
                type="password"
                required
                minLength={8}
                placeholder="New password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="Confirm password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Saving…" : "Reset password"}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}