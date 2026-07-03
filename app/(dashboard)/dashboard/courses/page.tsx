import { redirect } from "next/navigation"
import { requireUser } from "@/lib/server-auth"
import { getCoursesAction } from "@/actions/course.action"
import { CourseManager } from "@/components/courses/course-manager"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function CoursesPage() {
  const user = await requireUser()
  if (user.role !== "ADMIN") redirect("/dashboard")

  const result = await getCoursesAction()
  const courses = result.ok ? result.data : []

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
              <BreadcrumbItem><BreadcrumbPage>Courses</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/20">
          {!result.ok ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-rose-600">
              Couldn't load courses: {result.error}
            </div>
          ) : (
            <CourseManager initialCourses={courses} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}