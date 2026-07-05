/**
 * components/auth/change-password-component.tsx
 *
 * For logged-in users who want to change their password.
 * Different from reset-password (which uses a token from email).
 *
 * Flow:
 * 1. User enters current password + new password + confirm
 * 2. changePasswordServerAction is called (reads token from cookie server-side)
 * 3. On success → show success message + option to go back
 *
 * Note: We use the server action variant (auth-server.action.ts) because
 * it reads the accessToken from the HttpOnly cookie — no need to pass it
 * from the client store.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { changePasswordServerAction } from "@/actions/auth-server.action";
import { toastSuccess, toastError } from "@/lib/toast";

type State = "idle" | "loading" | "success";

export default function ChangePasswordComponent() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  // Track values to validate confirm password client-side
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // Client-side confirm check (fast feedback, no round trip)
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      toastError("New passwords do not match");
      return;
    }

    setState("loading");

    const formData = new FormData(e.currentTarget);
    const result = await changePasswordServerAction(formData);

    if (!result.ok) {
      setError(result.error);
      toastError(result.error);
      setState("idle");
      return;
    }

    toastSuccess("Password changed");
    setState("success");
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6 text-center">
          {/* Green checkmark */}
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">Password changed</h1>
            <p className="text-sm text-gray-500 mt-1">
              Your password has been updated successfully.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition text-center"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Change password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your current password to set a new one.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              name="confirmPassword" // not sent to action — just for client validation
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Same as above"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                confirmPassword && newPassword !== confirmPassword
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
            />
            {/* Inline mismatch hint */}
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
            )}
          </div>

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <PasswordStrength password={newPassword} />
          )}

          {/* Server error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "loading" || (!!confirmPassword && newPassword !== confirmPassword)}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {state === "loading" ? "Saving…" : "Update password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Cancel
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Tiny password strength indicator ────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;
  const barColor =
    score <= 1 ? "bg-red-400" : score === 2 ? "bg-yellow-400" : score === 3 ? "bg-blue-400" : "bg-green-500";

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= score ? barColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Checklist */}
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-xs">
            <span className={c.pass ? "text-green-500" : "text-gray-300"}>
              {c.pass ? "✓" : "○"}
            </span>
            <span className={c.pass ? "text-gray-600" : "text-gray-400"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}