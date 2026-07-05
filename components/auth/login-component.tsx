"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginServerAction } from "@/actions/auth-server.action";
import { useAuthStore } from "@/store/auth.store";
import { toastSuccess, toastError } from "@/lib/toast";

export default function LoginComponent() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">
            University Attendance System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or Student ID
            </label>
            <input
              name="identifier"
              type="text"
              required
              placeholder="e.g. john@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input name="rememberMe" type="checkbox" id="rememberMe" />
            <label htmlFor="rememberMe" className="text-sm text-gray-600">
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
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
          <p>
            No account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}