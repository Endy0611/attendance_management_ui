import { redirect } from "next/navigation"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { requireUser } from "@/lib/server-auth"
import { getMyActiveSessionsAction } from "@/actions/session.action"
import { getMyDeviceAction } from "@/actions/device.action"
import { getMyFaceStatusAction } from "@/actions/face.action"
import { CheckInManager } from "@/components/attendance/check-in-manager"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SparklesIcon } from "lucide-react"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] })

export default async function CheckInPage() {
  const user = await requireUser()
  if (user.role !== "STUDENT") redirect("/dashboard")

  // Was only fetching sessions + device and never face status, even though
  // CheckInManager requires `initialFaceStatus` to know whether the student
  // has a face registered yet. Left undefined, `faceRegistered` was always
  // falsy, so `canSubmit` could never become true — check-in was silently
  // broken for every student regardless of what they did in the UI.
  const [sessionsResult, deviceResult, faceResult] = await Promise.all([
    getMyActiveSessionsAction(),
    getMyDeviceAction(),
    getMyFaceStatusAction(),
  ])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Check In</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center gap-6 p-4 sm:p-6 bg-muted/20">
          <div className="w-full max-w-lg space-y-1 text-center sm:text-left">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold flex items-center justify-center sm:justify-start gap-2">
              <SparklesIcon className="size-5" style={{ color: "#1C4D8D" }} />
              Smart Check-In
            </h1>
            <p className="text-sm text-muted-foreground">
              Location, device, and face verification — all in one place.
            </p>
          </div>

          {!sessionsResult.ok ? (
            <div className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center text-sm text-rose-600">
              Couldn't load your sessions: {sessionsResult.error}
            </div>
          ) : (
            <CheckInManager
              initialSessions={sessionsResult.data}
              initialDevice={deviceResult.ok ? deviceResult.data : null}
              initialFaceStatus={faceResult.ok ? faceResult.data : null}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}