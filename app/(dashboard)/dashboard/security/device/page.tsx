import { redirect } from "next/navigation"
import { requireUser } from "@/lib/server-auth"
import { getMyDeviceAction } from "@/actions/device.action"
import { DeviceManager } from "@/components/security/device-manager"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function DevicePage() {
  const user = await requireUser()
  if (user.role !== "STUDENT") redirect("/dashboard")

  const result = await getMyDeviceAction()

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
              <BreadcrumbItem><BreadcrumbPage>Device Binding</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">Device Binding</h1>

          {!result.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600 max-w-lg">
              Couldn't load device status: {result.error}
            </div>
          ) : (
            <DeviceManager initialDevice={result.data} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}