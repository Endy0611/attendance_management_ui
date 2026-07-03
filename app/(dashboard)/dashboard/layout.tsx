import { requireUser } from "@/lib/server-auth"
import { AuthSync } from "@/components/auth/auth-sync"

/**
 * Wraps every /dashboard/* route. requireUser() calls GET /auths/me
 * server-side using the httpOnly accessToken cookie — the same call shown
 * in the Swagger screenshot — and redirects to /login if it's missing or
 * the backend rejects it. That result (real, fresh role included) is then
 * pushed into the client auth store via AuthSync, so AppSidebar/RoleGuard/
 * useAuthStore consumers are never working off stale or empty client cache.
 *
 * This layout doesn't render any chrome of its own (each page still owns
 * its <SidebarProvider>/<AppSidebar>) — it only adds the auth check + sync.
 */
export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return (
    <>
      <AuthSync user={user} />
      {children}
    </>
  )
}
