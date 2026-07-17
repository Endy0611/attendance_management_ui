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
import { PlusIcon, PencilIcon, Trash2Icon, LoaderIcon, RefreshCwIcon } from "lucide-react"

interface TimetableManagerProps {
  initialSlots: TimetableSlotResponse[]
  groups: GroupResponse[]
  zones: ZoneResponse[]
}

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
}

export function TimetableManager({ initialSlots, groups, zones }: TimetableManagerProps) {
  const [slots, setSlots] = useState<TimetableSlotResponse[]>(initialSlots)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TimetableSlotResponse | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const res = await getTimetableForRoleAction()
    if (res.ok) setSlots(res.data)
    else setError(res.error)
    setRefreshing(false)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this weekly slot? Already-generated sessions stay untouched.")) return
    setBusyId(id)
    const result = await deleteTimetableSlotAction(id)
    setBusyId(null)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold font-[family-name:var(--font-display)]">Timetable</h1>
          <p className="text-sm text-muted-foreground">Weekly recurring slots that auto-generate sessions.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setDialogOpen(true) }}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#1C4D8D" }}
        >
          <PlusIcon className="size-4" />
          New Slot
        </button>
      </div>

      {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

      {slots.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border rounded-xl bg-card">
          No weekly slots yet. Create one to start auto-generating sessions.
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card relative">
          {refreshing && (
            <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10">
              <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Group</th>
                <th className="text-left px-4 py-2.5 font-medium">Zone</th>
                <th className="text-left px-4 py-2.5 font-medium">Day</th>
                <th className="text-left px-4 py-2.5 font-medium">Time</th>
                <th className="text-left px-4 py-2.5 font-medium">Starts</th>
                <th className="text-left px-4 py-2.5 font-medium">Sessions</th>
                <th className="text-right px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{slot.groupName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{slot.courseCode ?? ""}</div>
                  </td>
                  <td className="px-4 py-2.5">{slot.zoneName ?? "—"}</td>
                  <td className="px-4 py-2.5">{DAY_LABEL[slot.dayOfWeek] ?? slot.dayOfWeek}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{slot.validFrom}</td>
                  <td className="px-4 py-2.5">
                    <span className={slot.generatedSessionsCount < slot.totalSessions ? "text-amber-600" : "text-emerald-600"}>
                      {slot.generatedSessionsCount}/{slot.totalSessions}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleGenerate(slot.id)}
                        disabled={busyId === slot.id}
                        title="Generate sessions"
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        {busyId === slot.id
                          ? <LoaderIcon className="size-4 animate-spin" />
                          : <RefreshCwIcon className="size-4" />}
                      </button>
                      <button
                        onClick={() => { setEditing(slot); setDialogOpen(true) }}
                        title="Edit"
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        disabled={busyId === slot.id}
                        title="Delete"
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    </div>
  )
}