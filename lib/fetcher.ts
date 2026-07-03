/**
 * lib/fetcher.ts
 *
 * A custom SWR fetcher that:
 * 1. Reads the accessToken from Zustand store
 * 2. Attaches it as Authorization header
 * 3. If the response is 401 (token expired):
 *    → calls /api/auth/refresh to get a new token
 *    → retries the original request once with the new token
 *    → if refresh also fails → clears store and redirects to /login
 *
 * Usage with SWR:
 *   const { data } = useSWR('/api/v1/auths/me', apiFetcher)
 */

import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetcher<T>(path: string): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  // Happy path
  if (res.ok) {
    const json = await res.json();
    return json.payload as T;
  }

  // Token expired — try to refresh
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });

    if (refreshRes.ok) {
      // Retry original request with new token
      const { accessToken: newToken } = await refreshRes.json();

      const retry = await fetch(`${BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      });

      if (retry.ok) {
        const json = await retry.json();
        return json.payload as T;
      }
    }

    // Refresh also failed — log out
    clearAuth();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  // Other error
  const json = await res.json().catch(() => ({}));
  throw new Error(json.message ?? `Request failed: ${res.status}`);
}