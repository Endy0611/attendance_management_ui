import { requireUser } from "@/lib/server-auth"
import { ProfileManager } from "@/components/settings/profile-manager"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function ProfilePage() {
  // requireUser() doubles as our "get current profile" call here — there's
  // no separate list to fetch, the logged-in user IS the resource.
  const user = await requireUser()

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
              <BreadcrumbItem><BreadcrumbPage>Profile Settings</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/20">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
              Profile Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your personal info and account security.
            </p>
          </div>

          <ProfileManager initialUser={user} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}