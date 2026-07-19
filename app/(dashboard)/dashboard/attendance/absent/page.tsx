"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi, sessionApi } from "@/lib/api"
import type { AbsentStudent, Session } from "@/lib/api"
import { XCircleIcon, CheckCircleIcon, MailIcon, IdCardIcon } from "lucide-react"

const NAVY = "#1C4D8D"

// Was `className="input"`, a class that isn't defined anywhere reachable —
// selects rendered with no border/padding/color. Spelled out explicitly.
const SELECT_CLS = "w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#1C4D8D] focus:ring-2 focus:ring-[#1C4D8D]/15 disabled:opacity-60"

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

        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 bg-muted/20">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Absent Students</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pick a session to see who didn't check in.</p>
          </div>

          <select className={SELECT_CLS} value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingSessions}>
            <option value="">{loadingSessions ? "Loading…" : "Select a session"}</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
              </option>
            ))}
          </select>

          {selected && !loading && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 px-3 py-1 text-sm font-medium">
              <XCircleIcon className="size-4" />
              {absent.length} student{absent.length !== 1 ? "s" : ""} absent
            </div>
          )}

          {selected && (
            loading
              ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
              : absent.length === 0
                ? (
                  <div className="rounded-2xl border bg-card p-10 text-center">
                    <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-3">
                      <CheckCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="font-medium text-sm">Everyone's here</p>
                    <p className="text-muted-foreground text-xs mt-1">All students checked in for this session.</p>
                  </div>
                )
                : (
                  <>
                    {/* Mobile cards */}
                    <div className="grid gap-2.5 sm:hidden">
                      {absent.map((a, i) => (
                        <div key={a.studentId} className="rounded-xl border bg-card p-3.5 flex items-start gap-3">
                          <span className="size-7 shrink-0 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium text-sm truncate">{a.studentName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                              <MailIcon className="size-3 shrink-0" /> {a.studentEmail}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <IdCardIcon className="size-3 shrink-0" /> {a.studentNumber || "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block rounded-2xl border overflow-hidden">
                      <div className="overflow-x-auto">
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
                              <tr key={a.studentId} className="border-t hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground">
                                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-semibold">
                                    {i + 1}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{a.studentName}</td>
                                <td className="px-4 py-3 text-muted-foreground">{a.studentEmail}</td>
                                <td className="px-4 py-3 text-muted-foreground">{a.studentNumber || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}