"use client"

import { useState, useTransition } from "react"
import { getHolidaysAction, deleteHolidayAction } from "@/actions/holiday.action"
import { HolidayFormDialog } from "@/components/holidays/holiday-form-dialog"
import { IfRole } from "@/components/role-guard"
import type { HolidayResponse } from "@/types/holiday-types"
import { formatDate } from "@/lib/date"
import { toastSuccess, toastError } from "@/lib/toast"
import { PlusIcon, TrashIcon, LoaderIcon, CalendarOffIcon } from "lucide-react"

export function HolidayManager({ initialHolidays }: { initialHolidays: HolidayResponse[] }) {
  const [holidays, setHolidays] = useState(initialHolidays)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getHolidaysAction()
      if (result.ok) setHolidays(result.data)
    })
  }

  async function handleDelete(holiday: HolidayResponse) {
    if (
      !confirm(
        `Remove "${holiday.name}"? This won't bring back any session it already cancelled — you'd need to regenerate the affected timetable slot separately.`
      )
    )
      return
    setDeletingId(holiday.id)
    const result = await deleteHolidayAction(holiday.id)
    setDeletingId(null)

    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess("Holiday removed")
    refresh()
  }

  const today = new Date().toISOString().slice(0, 10)
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((h) => h.date >= today)
  const past = sorted.filter((h) => h.date < today)

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
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            <PlusIcon className="size-4" />
            Add Holiday
          </button>
        </IfRole>
      </div>

      {isRefreshing && holidays.length === 0 ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-[#1C4D8D]/10 text-[#1C4D8D]">
            <CalendarOffIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No holidays yet</p>
          <p className="text-xs text-muted-foreground">
            Add a date to skip it across every recurring timetable slot.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <HolidaySection
              title="Upcoming"
              holidays={upcoming}
              deletingId={deletingId}
              onDelete={handleDelete}
            />
          )}
          {past.length > 0 && (
            <HolidaySection
              title="Past"
              holidays={past}
              deletingId={deletingId}
              onDelete={handleDelete}
              muted
            />
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
    </div>
  )
}

function HolidaySection({
  title,
  holidays,
  deletingId,
  onDelete,
  muted,
}: {
  title: string
  holidays: HolidayResponse[]
  deletingId: string | null
  onDelete: (h: HolidayResponse) => void
  muted?: boolean
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h2>
      <div className="rounded-2xl border bg-card divide-y overflow-hidden">
        {holidays.map((h) => (
          <div
            key={h.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${muted ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-[#1C4D8D]/10 text-[#1C4D8D] size-11 font-[family-name:var(--font-mono)]">
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
                disabled={deletingId === h.id}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 shrink-0"
              >
                {deletingId === h.id ? (
                  <LoaderIcon className="size-3.5 animate-spin" />
                ) : (
                  <TrashIcon className="size-3.5" />
                )}
              </button>
            </IfRole>
          </div>
        ))}
      </div>
    </div>
  )
}