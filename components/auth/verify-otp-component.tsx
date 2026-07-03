/**
 * verify-otp-component.tsx
 *
 * Used for two things:
 *   1. After register → verify email
 *   2. After forgot-password → we handle this separately in forgot-password flow
 *
 * The email comes from the URL: /verify-otp?email=john@gmail.com
 *
 * Flow:
 * 1. User enters 6-digit OTP from their email
 * 2. verifyOtpAction is called
 * 3. On success → redirect to /login with a success message
 * 4. "Resend" button calls resendOtpAction
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth.action";

export default function VerifyOtpComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL query param
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await verifyOtpAction(email, otp);

    if (!result.ok) {
      setError(result.error);
    } else {
      // Redirect to login with success hint
      router.push("/login?verified=1");
    }

    setLoading(false);
  }

  async function handleResend() {
    setError("");
    setInfo("Sending…");

    const result = await resendOtpAction(email);
    setInfo(result.ok ? "A new code was sent to your email." : "");
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {/* Single input for the 6-digit OTP */}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // digits only
            placeholder="123456"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {info && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <button
          onClick={handleResend}
          className="w-full text-sm text-blue-600 hover:underline"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}