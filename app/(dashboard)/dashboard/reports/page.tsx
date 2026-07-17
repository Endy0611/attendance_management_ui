"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { sessionApi, groupApi, reportApi } from "@/lib/api"
import type { Session, Group } from "@/lib/api"
import { DownloadIcon, LoaderIcon, FileTextIcon } from "lucide-react"

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

        <main className="flex flex-1 flex-col gap-6 p-6">
          <h1 className="text-2xl font-bold">Reports & Exports</h1>
          <p className="text-sm text-muted-foreground -mt-2">Download attendance data as CSV for any session or group.</p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Session export */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-lg">
                  <FileTextIcon className="size-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="font-semibold">Session Report</h2>
                  <p className="text-xs text-muted-foreground">Attendance for a single session</p>
                </div>
              </div>
              <select className="input w-full" value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={loadingS}>
                <option value="">{loadingS ? "Loading…" : "Select a session"}</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button onClick={exportSession} disabled={!sessionId || exporting === "session"}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {exporting === "session" ? <LoaderIcon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
                {exporting === "session" ? "Exporting…" : "Download CSV"}
              </button>
            </div>

            {/* Group export */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-violet-50 dark:bg-violet-950 rounded-lg">
                  <FileTextIcon className="size-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-semibold">Group Report</h2>
                  <p className="text-xs text-muted-foreground">Full attendance matrix across all sessions</p>
                </div>
              </div>
              <select className="input w-full" value={groupId} onChange={e => setGroupId(e.target.value)} disabled={loadingG}>
                <option value="">{loadingG ? "Loading…" : "Select a group"}</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.courseCode})</option>
                ))}
              </select>
              <button onClick={exportGroup} disabled={!groupId || exporting === "group"}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {exporting === "group" ? <LoaderIcon className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
                {exporting === "group" ? "Exporting…" : "Download CSV"}
              </button>
            </div>
          </div>
        </main>
      </SidebarInset>

      {toast && <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
    </SidebarProvider>
  )
}