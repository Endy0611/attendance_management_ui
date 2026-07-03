"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { attendanceApi } from "@/lib/api"
import type { StudentAttendance } from "@/lib/api"
import { CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react"

const STATUS_ICON: Record<string, React.ReactNode> = {
  PRESENT: <CheckCircleIcon className="size-4 text-green-600" />,
  LATE:    <ClockIcon className="size-4 text-amber-600" />,
  ABSENT:  <XCircleIcon className="size-4 text-red-600" />,
}
const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE:    "bg-amber-100 text-amber-700",
  ABSENT:  "bg-red-100 text-red-700",
}

export default function MyAttendancePage() {
  const [records, setRecords] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    attendanceApi.mySessions().then(setRecords).finally(() => setLoading(false))
  }, [])

  const present = records.filter(r => r.status === "PRESENT").length
  const late    = records.filter(r => r.status === "LATE").length
  const absent  = records.filter(r => r.status === "ABSENT").length
  const total   = records.length
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0

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
              <BreadcrumbItem><BreadcrumbPage>My Attendance</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <h1 className="text-2xl font-bold">My Attendance</h1>

          {/* Summary */}
          {!loading && (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Present",          value: present, style: "bg-green-50 text-green-700 dark:bg-green-950" },
                { label: "Late",             value: late,    style: "bg-amber-50 text-amber-700 dark:bg-amber-950" },
                { label: "Absent",           value: absent,  style: "bg-red-50 text-red-700 dark:bg-red-950" },
                { label: "Attendance Rate",  value: `${rate}%`, style: "bg-sky-50 text-sky-700 dark:bg-sky-950" },
              ].map(c => (
                <div key={c.label} className={`rounded-xl p-4 text-center ${c.style}`}>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Records */}
          {loading
            ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
            : records.length === 0
              ? <p className="text-center text-muted-foreground py-12">No attendance records yet.</p>
              : (
                <div className="rounded-xl border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        {["Group", "Course", "Status", "Checked In"].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.attendanceId} className="border-t hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{r.groupName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.courseCode}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {STATUS_ICON[r.status]}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}