"use client"

import { useState, useTransition } from "react"
import { getHolidaysAction, deleteHolidayAction } from "@/actions/holiday.action"
import { HolidayFormDialog } from "@/components/holidays/holiday-form-dialog"
import { IfRole } from "@/components/role-guard"
import type { HolidayResponse } from "@/types/holiday-types"
import { formatDate } from "@/lib/date"
import { toastSuccess, toastError } from "@/lib/toast"
import {
  PlusIcon, TrashIcon, LoaderIcon, CalendarOffIcon,
  AlertTriangleIcon, CalendarDaysIcon, ChevronDownIcon, HourglassIcon,
} from "lucide-react"

// Navy accent — matches the course, group, major, zone & timetable dialogs.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-9 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <AlertTriangleIcon className="size-4.5" />
          </div>
          <p className="text-sm leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading} className="px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="min-w-24 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? <LoaderIcon className="size-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function HolidayManager({ initialHolidays }: { initialHolidays: HolidayResponse[] }) {
  const [holidays, setHolidays] = useState(initialHolidays)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<HolidayResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getHolidaysAction()
      if (result.ok) setHolidays(result.data)
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteHolidayAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess("Holiday removed")
    refresh()
  }

  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((h) => h.date >= today)
  const past = sorted.filter((h) => h.date < today).reverse()

  const next = upcoming[0]
  const daysUntilNext = next
    ? Math.round((new Date(next.date).getTime() - new Date(today).getTime()) / 86400000)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Holidays
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            University-wide blackout dates — recurring timetable slots skip these automatically
          </p>
        </div>
        <IfRole allow={["ADMIN"]}>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}
          >
            <PlusIcon className="size-4" />
            Add Holiday
          </button>
        </IfRole>
      </div>

      {/* Stat chips */}
      {holidays.length > 0 && (
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          {[
            { label: "Upcoming", value: upcoming.length, icon: <CalendarDaysIcon className="size-3.5" /> },
            { label: "Past", value: past.length, icon: <CalendarOffIcon className="size-3.5" /> },
            {
              label: next ? "Until next" : "Next holiday",
              value: next ? `${daysUntilNext}d` : "—",
              icon: <HourglassIcon className="size-3.5" />,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card px-3.5 py-2.5">
              <div className="flex items-center gap-1.5" style={{ color: NAVY }}>
                {s.icon}
                <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-lg font-semibold tracking-tight mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {isRefreshing && holidays.length === 0 ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
            <CalendarOffIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No holidays yet</p>
          <p className="text-xs text-muted-foreground">
            Add a date to skip it across every recurring timetable slot.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 ? (
            <HolidaySection title="Upcoming" holidays={upcoming} onDelete={setToDelete} />
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming holidays scheduled.</p>
          )}

          {past.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronDownIcon className={`size-3.5 transition-transform ${showPast ? "rotate-180" : ""}`} />
                {showPast ? "Hide" : "Show"} past holidays ({past.length})
              </button>
              {showPast && (
                <HolidaySection title="Past" holidays={past} onDelete={setToDelete} muted />
              )}
            </div>
          )}
        </div>
      )}

      {dialogOpen && (
        <HolidayFormDialog
          onClose={() => setDialogOpen(false)}
          onSaved={() => {
            toastSuccess("Holiday added — affected sessions have been rescheduled")
            setDialogOpen(false)
            refresh()
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Remove "${toDelete.name}"? This won't bring back any session it already cancelled — you'd need to regenerate the affected timetable slot separately.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

function HolidaySection({
  title,
  holidays,
  onDelete,
  muted,
}: {
  title: string
  holidays: HolidayResponse[]
  onDelete: (h: HolidayResponse) => void
  muted?: boolean
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="rounded-2xl border bg-card divide-y overflow-hidden">
        {holidays.map((h, i) => (
          <div
            key={h.id}
            className={`group flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-bottom-1 ${muted ? "opacity-60" : ""}`}
            style={{ animationDelay: `${i * 30}ms`, animationDuration: "300ms", animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 flex flex-col items-center justify-center rounded-lg size-11 font-[family-name:var(--font-mono)]" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
                <span className="text-[10px] leading-none mt-1.5">
                  {new Date(h.date).toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Phnom_Penh" })}
                </span>
                <span className="text-sm font-semibold leading-none mb-1.5">
                  {h.date.slice(8, 10)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{h.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
              </div>
            </div>
            <IfRole allow={["ADMIN"]}>
              <button
                onClick={() => onDelete(h)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </IfRole>
          </div>
        ))}
      </div>
    </div>
  )
}