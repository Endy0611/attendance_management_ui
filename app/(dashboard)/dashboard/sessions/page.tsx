import { redirect } from "next/navigation"
import { requireUser } from "@/lib/server-auth"
import { getSessionsForRoleAction } from "@/actions/session.action"
import { getMyGroupsAction } from "@/actions/group.action"
import { getZonesAction } from "@/actions/zone.action"
import { SessionManager } from "@/components/sessions/session-manager"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function SessionsPage() {
  const user = await requireUser()
  // Defense in depth — proxy.ts already redirects at the edge per ROUTE_POLICY.
  if (user.role !== "ADMIN" && user.role !== "INSTRUCTOR") redirect("/dashboard")

  const [sessionsResult, groupsResult, zonesResult] = await Promise.all([
    getSessionsForRoleAction(),
    getMyGroupsAction(),
    getZonesAction(),
  ])

  const sessions = sessionsResult.ok ? sessionsResult.data : []
  const groups = groupsResult.ok ? groupsResult.data : []
  const zones = zonesResult.ok ? zonesResult.data : []

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Sessions</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/20">
          {!sessionsResult.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600">
              Couldn't load sessions: {sessionsResult.error}
            </div>
          ) : (
            <SessionManager initialSessions={sessions} groups={groups} zones={zones} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}