"use client"

import { useState, useCallback } from "react"
import {
  getTimetableForRoleAction,
  deleteTimetableSlotAction,
  generateSessionsAction,
} from "@/actions/timetable.action"
import type { TimetableSlotResponse } from "@/types/timetable-types"
import type { GroupResponse } from "@/types/group-types"
import type { ZoneResponse } from "@/types/zone-types"
import { TimetableFormDialog } from "./timetable-form-dialog"
import {
  PlusIcon, PencilIcon, Trash2Icon, LoaderIcon, RefreshCwIcon,
  CalendarClockIcon, AlertTriangleIcon, LayersIcon, CheckCircle2Icon,
} from "lucide-react"

// Navy accent — matches the course, group, major & zone dialogs.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

interface TimetableManagerProps {
  initialSlots: TimetableSlotResponse[]
  groups: GroupResponse[]
  zones: ZoneResponse[]
}

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
}

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

export function TimetableManager({ initialSlots, groups, zones }: TimetableManagerProps) {
  const [slots, setSlots] = useState<TimetableSlotResponse[]>(initialSlots)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableSlotResponse | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<TimetableSlotResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const res = await getTimetableForRoleAction()
    if (res.ok) setSlots(res.data)
    else setError(res.error)
    setRefreshing(false)
  }, [])

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteTimetableSlotAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (!result.ok) { setError(result.error); return }
    refresh()
  }

  async function handleGenerate(id: string) {
    setBusyId(id)
    const result = await generateSessionsAction(id)
    setBusyId(null)
    if (!result.ok) { setError(result.error); return }
    refresh()
  }

  const totalSessions = slots.reduce((a, s) => a + s.totalSessions, 0)
  const generatedSessions = slots.reduce((a, s) => a + s.generatedSessionsCount, 0)
  const pendingSlots = slots.filter((s) => s.generatedSessionsCount < s.totalSessions).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Timetable
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Weekly recurring slots that auto-generate sessions.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <PlusIcon className="size-4" />
          New Slot
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Weekly slots", value: slots.length, icon: <CalendarClockIcon className="size-3.5" /> },
          { label: "Sessions generated", value: `${generatedSessions}/${totalSessions}`, icon: <CheckCircle2Icon className="size-3.5" /> },
          { label: "Need generating", value: pendingSlots, icon: <LayersIcon className="size-3.5" /> },
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

      {error && <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">{error}</p>}

      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
            <CalendarClockIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No weekly slots yet</p>
          <p className="text-xs text-muted-foreground">Create one to start auto-generating sessions.</p>
        </div>
      ) : (
        <div className="border rounded-2xl overflow-hidden bg-card relative shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)]">
          {refreshing && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
              <LoaderIcon className="size-5 animate-spin" style={{ color: NAVY }} />
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="text-muted-foreground text-[11px] uppercase tracking-wide" style={{ backgroundColor: NAVY_SOFT }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium">Group</th>
                <th className="text-left px-4 py-3 font-medium">Zone</th>
                <th className="text-left px-4 py-3 font-medium">Day</th>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Starts</th>
                <th className="text-left px-4 py-3 font-medium">Sessions</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {slots.map((slot) => {
                const pct = slot.totalSessions ? Math.min(100, Math.round((slot.generatedSessionsCount / slot.totalSessions) * 100)) : 0
                const complete = slot.generatedSessionsCount >= slot.totalSessions
                return (
                  <tr key={slot.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-medium">{slot.groupName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{slot.courseCode ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{slot.zoneName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: NAVY_SOFT, color: NAVY }}
                      >
                        {DAY_LABEL[slot.dayOfWeek] ?? slot.dayOfWeek}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-[family-name:var(--font-mono)]">
                      {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-[family-name:var(--font-mono)]">{slot.validFrom}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-24">
                        <span className={complete ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                          {slot.generatedSessionsCount}/{slot.totalSessions}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden mt-1 w-20">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: complete ? "#059669" : "#F59E0B" }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleGenerate(slot.id)}
                          disabled={busyId === slot.id}
                          title="Generate sessions"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                          {busyId === slot.id
                            ? <LoaderIcon className="size-4 animate-spin" />
                            : <RefreshCwIcon className="size-4" />}
                        </button>
                        <button
                          onClick={() => { setEditing(slot); setDialogOpen(true) }}
                          title="Edit"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <PencilIcon className="size-4" />
                        </button>
                        <button
                          onClick={() => setToDelete(slot)}
                          disabled={busyId === slot.id}
                          title="Delete"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <TimetableFormDialog
          slot={editing}
          groups={groups}
          zones={zones}
          onClose={() => setDialogOpen(false)}
          onSaved={() => { setDialogOpen(false); refresh() }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message="Delete this weekly slot? Already-generated sessions stay untouched."
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}