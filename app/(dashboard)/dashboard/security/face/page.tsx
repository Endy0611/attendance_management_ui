import { redirect } from "next/navigation"
import { requireUser } from "@/lib/server-auth"
import { getMyFaceStatusAction } from "@/actions/face.action"
import { FaceManager } from "@/components/security/face-manager"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function FacePage() {
  const user = await requireUser()
  if (user.role !== "STUDENT") redirect("/dashboard")

  const result = await getMyFaceStatusAction()

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
              <BreadcrumbItem><BreadcrumbPage>Face Registration</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">Face Registration</h1>

          {!result.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600 max-w-lg">
              Couldn't load face status: {result.error}
            </div>
          ) : (
            <FaceManager initialStatus={result.data} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}