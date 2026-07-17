import { requireUser } from "@/lib/server-auth"
import { getTimetableForRoleAction } from "@/actions/timetable.action"
import { getMyGroupsAction } from "@/actions/group.action"
import { getZonesAction } from "@/actions/zone.action"
import { TimetableManager } from "@/components/timetable/timetable-manager"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function TimetablePage() {
  await requireUser()

  const [slotsResult, groupsResult, zonesResult] = await Promise.all([
    getTimetableForRoleAction(),
    getMyGroupsAction(),
    getZonesAction(),
  ])

  const slots = slotsResult.ok ? slotsResult.data : []
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
              <BreadcrumbItem><BreadcrumbPage>Timetable</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/20">
          {!slotsResult.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600">
              Couldn't load timetable: {slotsResult.error}
            </div>
          ) : (
            <TimetableManager initialSlots={slots} groups={groups} zones={zones} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}