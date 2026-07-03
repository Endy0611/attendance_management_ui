"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import type { AppUserResponse } from "@/types/auth-types"

/**
 * Keeps the client-side Zustand store in sync with the server-verified
 * session. The server is the source of truth — the dashboard layout calls
 * requireUser() (which hits GET /auths/me with the httpOnly cookie) on
 * every full navigation into /dashboard/*, and hands the fresh result down
 * here. This overwrites whatever the client had cached: a stale role after
 * an admin changes it, or an empty store on a device/browser that has a
 * valid cookie but no localStorage yet.
 *
 * Mounted once in app/(dashboard)/layout.tsx, which — unlike the individual
 * page.tsx files — stays mounted across client-side navigations within the
 * group, so this doesn't re-run (and doesn't flash "Validating session...")
 * on every link click, only on full loads/refreshes.
 */
export function AuthSync({ user }: { user: AppUserResponse }) {
  const setUser = useAuthStore((s) => s.setUser)
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated)

  useEffect(() => {
    setUser(user)
    setHasHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.role, user.name, user.email])

  return null
}
