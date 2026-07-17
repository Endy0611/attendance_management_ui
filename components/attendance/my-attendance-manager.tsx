"use client"

import { formatDateTime } from "@/lib/date"
import type { StudentAttendanceResponse } from "@/types/attendance-types"
import { CheckCircle2Icon, XCircleIcon, ClockIcon, ClipboardListIcon } from "lucide-react"

const STATUS_ICON: Record<string, React.ElementType> = {
  PRESENT: CheckCircle2Icon,
  LATE: ClockIcon,
  ABSENT: XCircleIcon,
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950",
  LATE: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950",
  ABSENT: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950",
}

export function MyAttendanceManager({ records }: { records: StudentAttendanceResponse[] }) {
  const present = records.filter((r) => r.status === "PRESENT").length
  const late = records.filter((r) => r.status === "LATE").length
  const absent = records.filter((r) => r.status === "ABSENT").length
  const total = records.length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  const cards = [
    { label: "Present", value: present, accent: "#10B981" },
    { label: "Late", value: late, accent: "#F59E0B" },
    { label: "Absent", value: absent, accent: "#E11D48" },
    { label: "Attendance rate", value: `${rate}%`, accent: "#1C4D8D" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
          My Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} session{total === 1 ? "" : "s"} on record
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-5">
            <p
              className="text-3xl font-semibold font-[family-name:var(--font-mono)]"
              style={{ color: c.accent }}
            >
              {c.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-full bg-muted">
            <ClipboardListIcon className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">No attendance records yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Records show up here as soon as you check into a session.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {["Session", "Group", "Course", "Status", "Checked in"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const Icon = STATUS_ICON[r.status]
                return (
                  <tr key={r.attendanceId} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.sessionTitle || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.groupName}</td>
                    <td className="px-4 py-3 text-muted-foreground font-[family-name:var(--font-mono)] text-xs">
                      {r.courseCode}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[r.status]}`}
                      >
                        <Icon className="size-3.5" />
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.checkedInAt ? formatDateTime(r.checkedInAt) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}