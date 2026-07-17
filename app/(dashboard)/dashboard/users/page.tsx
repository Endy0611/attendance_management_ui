import { redirect } from "next/navigation"
import { requireUser } from "@/lib/server-auth"
import { getUsersAction } from "@/actions/admin.action"
import { UserManager } from "@/components/users/user-manager"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"

export default async function UsersPage() {
  const user = await requireUser()
  if (user.role !== "ADMIN") redirect("/dashboard")

  const result = await getUsersAction()
  const users = result.ok ? result.data : []

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
              <BreadcrumbItem><BreadcrumbPage>Users</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          {!result.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600">
              Couldn't load users: {result.error}
            </div>
          ) : (
            <UserManager initialUsers={users} currentUserId={user.id} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}