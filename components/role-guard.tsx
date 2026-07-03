"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuthStore } from "@/store/auth.store"
import { hasRole, type Role } from "@/lib/roles"
import { ShieldAlertIcon } from "lucide-react"

interface RoleGuardProps {
  allow: Role[]
  children: React.ReactNode
  /** If true, redirects to /dashboard instead of showing the inline denied state. */
  redirect?: boolean
  /** Custom fallback shown instead of the default "not allowed" card. */
  fallback?: React.ReactNode
}

export function RoleGuard({ allow, children, redirect = false, fallback }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  const loading = !useAuthStore((s) => s.hasHydrated)
  const router = useRouter()
  const allowed = hasRole(user, ...allow)

  useEffect(() => {
    if (!loading && !allowed && redirect) {
      router.replace("/dashboard")
    }
  }, [loading, allowed, redirect, router])

  if (loading) return null
  if (allowed) return <>{children}</>
  if (redirect) return null
  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-10 text-center">
      <div className="p-3 rounded-full bg-rose-100 text-rose-600">
        <ShieldAlertIcon className="size-6" />
      </div>
      <div>
        <p className="font-semibold">You don't have access to this page</p>
        <p className="text-sm text-muted-foreground mt-1">
          This section is restricted to {allow.join(" / ").toLowerCase()} accounts.
        </p>
      </div>
    </div>
  )
}

/** Inline variant for gating a single button/element rather than a whole page. */
export function IfRole({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!hasRole(user, ...allow)) return null
  return <>{children}</>
}