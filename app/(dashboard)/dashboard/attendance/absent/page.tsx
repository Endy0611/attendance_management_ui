"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi, sessionApi } from "@/lib/api"
import type { AbsentStudent, Session } from "@/lib/api"
import { XCircleIcon } from "lucide-react"

export default function AbsentPage() {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [selected,  setSelected]  = useState("")
  const [absent,    setAbsent]    = useState<AbsentStudent[]>([])
  const [loading,   setLoading]   = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    sessionApi.forCurrentUser().then(setSessions).finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    attendanceApi.absent(selected).then(setAbsent).finally(() => setLoading(false))
  }, [selected])

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
              <BreadcrumbItem><BreadcrumbPage>Absent Students</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">Absent Students</h1>

          <select className="input max-w-sm" value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingSessions}>
            <option value="">{loadingSessions ? "Loading…" : "Select a session"}</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
              </option>
            ))}
          </select>

          {selected && !loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircleIcon className="size-4 text-red-500" />
              {absent.length} student{absent.length !== 1 ? "s" : ""} absent
            </div>
          )}

          {selected && (
            loading
              ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
              : absent.length === 0
                ? <div className="rounded-xl border bg-card p-8 text-center">
                    <CheckCircleIcon className="size-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">All students checked in!</p>
                  </div>
                : (
                  <div className="rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          {["#", "Name", "Email", "Student ID"].map(h => (
                            <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {absent.map((a, i) => (
                          <tr key={a.studentId} className="border-t hover:bg-muted/30">
                            <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-3 font-medium">{a.studentName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{a.studentEmail}</td>
                            <td className="px-4 py-3 text-muted-foreground">{a.studentNumber || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}