"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi, sessionApi } from "@/lib/api"
import type { Attendance, AttendanceSummary, Session } from "@/lib/api"
import { DownloadIcon, UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react"

// `.input` and `.btn-ghost` weren't defined anywhere reachable — spelled
// out explicitly so the select and export button are guaranteed styled.
const SELECT_CLS = "w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#1C4D8D] focus:ring-2 focus:ring-[#1C4D8D]/15 disabled:opacity-60"
const BTN_GHOST = "px-3.5 py-2 rounded-lg text-sm font-medium border border-border text-foreground bg-background hover:bg-muted transition-colors"

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  LATE:    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  ABSENT:  "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
}

export default function AttendanceSessionPage() {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [selected,  setSelected]  = useState<string>("")
  const [records,   setRecords]   = useState<Attendance[]>([])
  const [summary,   setSummary]   = useState<AttendanceSummary | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    sessionApi.forCurrentUser().then(setSessions).finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    Promise.all([attendanceApi.bySession(selected), attendanceApi.summary(selected)])
      .then(([r, s]) => { setRecords(r); setSummary(s) })
      .finally(() => setLoading(false))
  }, [selected])

  async function exportCSV() {
    if (!selected) return
    const { reportApi } = await import("@/lib/api")
    await reportApi.exportSession(selected)
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
              <BreadcrumbItem><BreadcrumbLink href="/dashboard/attendance/session">Attendance</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>By Session</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Attendance by Session</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Review check-ins and export a report.</p>
            </div>
            {selected && (
              <button onClick={exportCSV} className={`${BTN_GHOST} flex items-center justify-center gap-2 shrink-0`}>
                <DownloadIcon className="size-4" /> Export CSV
              </button>
            )}
          </div>

          {/* Session picker */}
          <select className={SELECT_CLS} value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingSessions}>
            <option value="">{loadingSessions ? "Loading sessions…" : "Select a session"}</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
              </option>
            ))}
          </select>

          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total",   value: summary.totalStudents, icon: UsersIcon,       tone: "text-sky-600 dark:text-sky-400",       bg: "bg-sky-50 dark:bg-sky-950" },
                { label: "Present", value: summary.present,       icon: CheckCircleIcon, tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
                { label: "Late",    value: summary.late,          icon: ClockIcon,       tone: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950" },
                { label: "Absent",  value: summary.absent,        icon: XCircleIcon,     tone: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-950" },
              ].map(c => (
                <div key={c.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
                  <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
                    <c.icon className={`size-4.5 ${c.tone}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{c.label}</p>
                    <p className="text-xl font-bold tracking-tight">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Records */}
          {selected && (
            loading
              ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
              : (
                <>
                  {/* Mobile cards */}
                  <div className="grid gap-2.5 sm:hidden">
                    {records.map(r => (
                      <div key={r.attendanceId} className="rounded-xl border bg-card p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{r.studentName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Checked in {new Date(r.checkedInAt).toLocaleTimeString()}</span>
                          <span>{r.distanceMeters?.toFixed(1) ?? "—"} m</span>
                        </div>
                      </div>
                    ))}
                    {records.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No attendance records for this session.</p>}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            {["Student", "Checked In", "Distance (m)", "Status"].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {records.map(r => (
                            <tr key={r.attendanceId} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium">{r.studentName}</td>
                              <td className="px-4 py-3 text-muted-foreground">{new Date(r.checkedInAt).toLocaleTimeString()}</td>
                              <td className="px-4 py-3">{r.distanceMeters?.toFixed(1) ?? "—"}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {records.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No attendance records for this session.</p>}
                  </div>
                </>
              )
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}