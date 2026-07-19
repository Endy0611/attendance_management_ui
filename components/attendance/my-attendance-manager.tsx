"use client"

import { formatDateTime } from "@/lib/date"
import type { StudentAttendanceResponse } from "@/types/attendance-types"
import { CheckCircle2Icon, XCircleIcon, ClockIcon, ClipboardListIcon } from "lucide-react"

const NAVY = "#1C4D8D"
const RING_SIZE = 108
const RING_STROKE = 9

const STATUS_ICON: Record<string, React.ElementType> = {
  PRESENT: CheckCircle2Icon,
  LATE: ClockIcon,
  ABSENT: XCircleIcon,
}

// Single source of truth for status color — text/bg/border/dot all derive
// from the same token so PRESENT never looks slightly different between
// the hero breakdown, the table pill, and the mobile card.
const STATUS_TOKEN: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  PRESENT: { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-900", dot: "#10B981" },
  LATE: { text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-900", dot: "#F59E0B" },
  ABSENT: { text: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950", border: "border-rose-200 dark:border-rose-900", dot: "#E11D48" },
}

// Circular rate indicator — replaces a 4th flat stat tile with an actual
// visual read of "how am I doing", since the rate is the one number a
// student is likely to care about most.
function RateRing({ rate }: { rate: number }) {
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - rate / 100)

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-muted/40"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={radius}
          fill="none"
          stroke={NAVY}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-semibold font-[family-name:var(--font-mono)] tabular-nums leading-none"
          style={{ color: NAVY }}
        >
          {rate}%
        </span>
        <span className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">Rate</span>
      </div>
    </div>
  )
}

export function MyAttendanceManager({ records }: { records: StudentAttendanceResponse[] }) {
  const present = records.filter((r) => r.status === "PRESENT").length
  const late = records.filter((r) => r.status === "LATE").length
  const absent = records.filter((r) => r.status === "ABSENT").length
  const total = records.length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  const breakdown = [
    { label: "Present", value: present, token: STATUS_TOKEN.PRESENT, icon: CheckCircle2Icon },
    { label: "Late", value: late, token: STATUS_TOKEN.LATE, icon: ClockIcon },
    { label: "Absent", value: absent, token: STATUS_TOKEN.ABSENT, icon: XCircleIcon },
  ]

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
          My Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} session{total === 1 ? "" : "s"} on record
        </p>
      </div>

      {/* Hero card — ring + breakdown side by side on larger screens,
          stacked on mobile. One cohesive summary instead of four
          same-sized tiles competing for attention. */}
      <div className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-black/[0.02] animate-in fade-in slide-in-from-bottom-1 duration-500">
        <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 sm:gap-8">
          <RateRing rate={rate} />

          <div className="flex-1 w-full grid grid-cols-3 sm:grid-cols-1 gap-3 sm:gap-0 sm:divide-y sm:divide-border">
            {breakdown.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={b.label}
                  className="flex flex-col sm:flex-row sm:items-center items-center sm:justify-between gap-1.5 sm:gap-0 sm:py-2.5 first:sm:pt-0 last:sm:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${b.token.dot}1F`, color: b.token.dot }}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{b.label}</span>
                  </div>
                  <span
                    className="text-lg sm:text-base font-semibold font-[family-name:var(--font-mono)] tabular-nums"
                    style={{ color: b.token.dot }}
                  >
                    {b.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-10 sm:p-12 text-center shadow-sm animate-in fade-in duration-500">
          <div className="p-3 rounded-full" style={{ backgroundColor: `${NAVY}14` }}>
            <ClipboardListIcon className="size-6" style={{ color: NAVY }} />
          </div>
          <div>
            <p className="font-medium text-sm">No attendance records yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Records show up here as soon as you check into a session.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop / tablet — real table, left accent bar per row for
              faster status scanning without leaning only on the pill. */}
          <div className="hidden sm:block rounded-2xl border bg-card overflow-hidden shadow-sm ring-1 ring-black/[0.02]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {["Session", "Group", "Course", "Status", "Checked in"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const Icon = STATUS_ICON[r.status]
                  const token = STATUS_TOKEN[r.status]
                  return (
                    <tr
                      key={r.attendanceId}
                      className="border-t border-l-[3px] transition-colors duration-200 hover:bg-muted/30 animate-in fade-in duration-500"
                      style={{ borderLeftColor: token.dot, animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: "backwards" }}
                    >
                      <td className="px-4 py-3 font-medium">{r.sessionTitle || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.groupName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-[family-name:var(--font-mono)] text-xs">
                        {r.courseCode}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-transform duration-200 hover:scale-105 ${token.bg} ${token.text} ${token.border}`}
                        >
                          <Icon className="size-3.5" />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {r.checkedInAt ? formatDateTime(r.checkedInAt) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile — card list, same left accent bar treatment */}
          <div className="sm:hidden space-y-2.5">
            {records.map((r, i) => {
              const Icon = STATUS_ICON[r.status]
              const token = STATUS_TOKEN[r.status]
              return (
                <div
                  key={r.attendanceId}
                  className="rounded-2xl border border-l-[3px] bg-card p-4 shadow-sm ring-1 ring-black/[0.02] animate-in fade-in slide-in-from-bottom-1 duration-500"
                  style={{ borderLeftColor: token.dot, animationDelay: `${Math.min(i, 12) * 40}ms`, animationFillMode: "backwards" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{r.sessionTitle || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {r.groupName} · <span className="font-[family-name:var(--font-mono)]">{r.courseCode}</span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${token.bg} ${token.text} ${token.border}`}
                    >
                      <Icon className="size-3.5" />
                      {r.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>Checked in</span>
                    <span className="tabular-nums">{r.checkedInAt ? formatDateTime(r.checkedInAt) : "—"}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}