"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { sessionApi, groupApi, reportApi } from "@/lib/api"
import type { Session, Group } from "@/lib/api"
import { DownloadIcon, LoaderIcon, FileTextIcon, CheckCircle2Icon } from "lucide-react"

const NAVY = "#1C4D8D"

// `.input` and `.btn-primary` weren't defined anywhere reachable — spelled
// out explicitly so both selects and both export buttons are guaranteed
// to render styled and in the brand color.
const SELECT_CLS = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#1C4D8D] focus:ring-2 focus:ring-[#1C4D8D]/15 disabled:opacity-60"
const BTN_PRIMARY = "w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"

export default function ReportsPage() {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [groups,    setGroups]    = useState<Group[]>([])
  const [sessionId, setSessionId] = useState("")
  const [groupId,   setGroupId]   = useState("")
  const [loadingS,  setLoadingS]  = useState(true)
  const [loadingG,  setLoadingG]  = useState(true)
  const [exporting, setExporting] = useState<"session" | "group" | null>(null)
  const [toast,     setToast]     = useState("")

  useEffect(() => {
    sessionApi.list().then(setSessions).finally(() => setLoadingS(false))
    groupApi.list().then(setGroups).finally(() => setLoadingG(false))
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  async function exportSession() {
    if (!sessionId) return
    setExporting("session")
    try { await reportApi.exportSession(sessionId); showToast("Session report downloaded") }
    catch (e: any) { showToast(e.message) }
    finally { setExporting(null) }
  }

  async function exportGroup() {
    if (!groupId) return
    setExporting("group")
    try { await reportApi.exportGroup(groupId); showToast("Group report downloaded") }
    catch (e: any) { showToast(e.message) }
    finally { setExporting(null) }
  }

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
              <BreadcrumbItem><BreadcrumbPage>Reports</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-muted/20">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reports &amp; Exports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Download attendance data as CSV for any session or group.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Session export */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 flex items-center justify-center bg-sky-50 dark:bg-sky-950 rounded-xl">
                  <FileTextIcon className="size-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm">Session Report</h2>
                  <p className="text-xs text-muted-foreground">Attendance for a single session</p>
                </div>
              </div>
              <select className={SELECT_CLS} value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={loadingS}>
                <option value="">{loadingS ? "Loading…" : "Select a session"}</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                onClick={exportSession}
                disabled={!sessionId || exporting === "session"}
                className={`${BTN_PRIMARY} flex items-center justify-center gap-2`}
                style={{ backgroundColor: NAVY }}
              >
                {exporting === "session" ? <LoaderIcon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
                {exporting === "session" ? "Exporting…" : "Download CSV"}
              </button>
            </div>

            {/* Group export */}
            <div className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 shrink-0 flex items-center justify-center bg-violet-50 dark:bg-violet-950 rounded-xl">
                  <FileTextIcon className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm">Group Report</h2>
                  <p className="text-xs text-muted-foreground">Full attendance matrix across all sessions</p>
                </div>
              </div>
              <select className={SELECT_CLS} value={groupId} onChange={e => setGroupId(e.target.value)} disabled={loadingG}>
                <option value="">{loadingG ? "Loading…" : "Select a group"}</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.courseCode})</option>
                ))}
              </select>
              <button
                onClick={exportGroup}
                disabled={!groupId || exporting === "group"}
                className={`${BTN_PRIMARY} flex items-center justify-center gap-2`}
                style={{ backgroundColor: NAVY }}
              >
                {exporting === "group" ? <LoaderIcon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
                {exporting === "group" ? "Exporting…" : "Download CSV"}
              </button>
            </div>
          </div>
        </main>
      </SidebarInset>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-foreground text-background text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2Icon className="size-4 shrink-0" style={{ color: "#4ade80" }} />
          {toast}
        </div>
      )}
    </SidebarProvider>
  )
}