/**
 * components/auth/logout-button.tsx
 *
 * Client component — needs to be client because it handles a click event
 * and clears the Zustand store.
 *
 * What it does:
 * 1. Calls POST /api/auth/logout  → clears HttpOnly cookies on server
 * 2. Calls clearAuth() on Zustand store → clears client-side state
 * 3. Redirects to /login
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { toastSuccess, toastError } from "@/lib/toast";

export default function LogoutButton() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    // Clear server-side HttpOnly cookies
    const res = await fetch("/api/auth/logout", { method: "POST" });

    // Clear client-side Zustand store
    clearAuth();

    if (res.ok) {
      toastSuccess("Signed out");
    } else {
      toastError("Signed out locally, but the server logout call failed.");
    }

    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-red-500 hover:underline disabled:opacity-50"
    >
      {loading ? "Signing out…" : "→ Sign out"}
    </button>
  );
}