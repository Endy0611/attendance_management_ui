"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi, sessionApi } from "@/lib/api"
import type { Attendance, AttendanceSummary, Session } from "@/lib/api"
import { DownloadIcon, UsersIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react"

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

  const STATUS_STYLE: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    LATE:    "bg-amber-100 text-amber-700",
    ABSENT:  "bg-red-100 text-red-700",
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
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Attendance by Session</h1>
            {selected && (
              <button onClick={exportCSV} className="btn-ghost flex items-center gap-2 text-sm">
                <DownloadIcon className="size-4" /> Export CSV
              </button>
            )}
          </div>

          {/* Session picker */}
          <select className="input max-w-sm" value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingSessions}>
            <option value="">{loadingSessions ? "Loading sessions…" : "Select a session"}</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
              </option>
            ))}
          </select>

          {/* Summary cards */}
          {summary && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Total",   value: summary.totalStudents, icon: <UsersIcon className="size-4 text-sky-600" />,    color: "bg-sky-50 dark:bg-sky-950" },
                { label: "Present", value: summary.present,       icon: <CheckCircleIcon className="size-4 text-green-600" />, color: "bg-green-50 dark:bg-green-950" },
                { label: "Late",    value: summary.late,          icon: <ClockIcon className="size-4 text-amber-600" />,  color: "bg-amber-50 dark:bg-amber-950" },
                { label: "Absent",  value: summary.absent,        icon: <XCircleIcon className="size-4 text-red-600" />,  color: "bg-red-50 dark:bg-red-950" },
              ].map(c => (
                <div key={c.label} className={`rounded-xl p-4 flex items-center gap-3 ${c.color}`}>
                  {c.icon}
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-xl font-bold">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Records table */}
          {selected && (
            loading
              ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
              : (
                <div className="rounded-xl border overflow-x-auto">
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
                        <tr key={r.attendanceId} className="border-t hover:bg-muted/30">
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
                  {records.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No attendance records for this session.</p>}
                </div>
              )
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}