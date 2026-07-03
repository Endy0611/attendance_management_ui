"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi, sessionApi } from "@/lib/api"
import type { Attendance, Session } from "@/lib/api"
import { LoaderIcon } from "lucide-react"

const STATUSES = ["PRESENT", "LATE", "ABSENT"] as const
type Status = typeof STATUSES[number]

const STATUS_STYLE: Record<Status, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-200",
  LATE:    "bg-amber-100 text-amber-700 border-amber-200",
  ABSENT:  "bg-red-100 text-red-700 border-red-200",
}

export default function OverridePage() {
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [selected,  setSelected]  = useState("")
  const [records,   setRecords]   = useState<Attendance[]>([])
  const [loading,   setLoading]   = useState(false)
  const [overriding,setOverriding]= useState<string | null>(null)
  const [toast,     setToast]     = useState("")
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    sessionApi.list().then(setSessions).finally(() => setLoadingSessions(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    attendanceApi.bySession(selected).then(setRecords).finally(() => setLoading(false))
  }, [selected])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 2500) }

  async function override(studentId: string, status: Status) {
    setOverriding(studentId)
    try {
      const updated = await attendanceApi.override(selected, studentId, status)
      setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status: updated.status } : r))
      showToast(`Status updated to ${status}`)
    } catch (e: any) { showToast(e.message) }
    finally { setOverriding(null) }
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
              <BreadcrumbItem><BreadcrumbPage>Override Attendance</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">Override Attendance</h1>
          <p className="text-sm text-muted-foreground">Manually change a student's attendance status for any session.</p>

          <select className="input max-w-sm" value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingSessions}>
            <option value="">{loadingSessions ? "Loading…" : "Select a session"}</option>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.groupName} — {s.courseCode} · {new Date(s.startTime).toLocaleDateString()}
              </option>
            ))}
          </select>

          {selected && (
            loading
              ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>
              : (
                <div className="rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        {["Student", "Checked In", "Current Status", "Override"].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.attendanceId} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{r.studentName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(r.checkedInAt).toLocaleTimeString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {overriding === r.studentId
                              ? <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                              : (
                                <div className="flex gap-1">
                                  {STATUSES.filter(s => s !== r.status).map(s => (
                                    <button key={s} onClick={() => override(r.studentId, s)}
                                      className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS_STYLE[s]}`}>
                                      → {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {records.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No records for this session.</p>}
                </div>
              )
          )}
        </main>
      </SidebarInset>

      {toast && <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
    </SidebarProvider>
  )
}