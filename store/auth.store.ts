/**
 * auth.store.ts
 *
 * Global auth state using Zustand.
 * Stores tokens + user info, and persists to localStorage.
 *
 * Usage anywhere:
 *   const { user, accessToken, setAuth, clearAuth } = useAuthStore()
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppUserResponse } from "@/types/auth-types";

interface AuthState {
  user: AppUserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;

  /**
   * True once Zustand has finished reading persisted state back out of
   * localStorage. On first paint (SSR / first client render) this is false
   * and `user` is not trustworthy yet — treat that as "session loading",
   * not "logged out". Without this, components that redirect/deny on
   * `!user` will bounce a logged-in user for a frame on every refresh.
   */
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  /** Call this after login/register to save tokens + user */
  setAuth: (
    tokens: { accessToken: string; refreshToken: string },
    user: AppUserResponse
  ) => void;

  /** Call this after logout */
  clearAuth: () => void;

  /** Update user info (e.g. after profile edit) */
  setUser: (user: AppUserResponse) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setAuth: (tokens, user) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage", // key in localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);