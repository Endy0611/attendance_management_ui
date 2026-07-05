"use client"

import { useState } from "react"
import { createTimetableSlotAction, updateTimetableSlotAction } from "@/actions/timetable.action"
import type { TimetableSlotResponse, DayOfWeek } from "@/types/timetable-types"
import type { GroupResponse } from "@/types/group-types"
import type { ZoneResponse } from "@/types/zone-types"
import { LoaderIcon, XIcon } from "lucide-react"

interface TimetableFormDialogProps {
  slot: TimetableSlotResponse | null
  groups: GroupResponse[]
  zones: ZoneResponse[]
  onClose: () => void
  onSaved: () => void
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
]

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function TimetableFormDialog({ slot, groups, zones, onClose, onSaved }: TimetableFormDialogProps) {
  const [groupId, setGroupId] = useState(slot?.groupId ?? "")
  const [zoneId, setZoneId] = useState(slot?.zoneId ?? "")
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(slot?.dayOfWeek ?? "MONDAY")
  // plain HH:mm — a time-of-day input has no date and no timezone attached,
  // so there's nothing here for the browser/Date object to misinterpret.
  const [startTime, setStartTime] = useState(slot?.startTime?.slice(0, 5) ?? "17:20")
  const [endTime, setEndTime] = useState(slot?.endTime?.slice(0, 5) ?? "19:00")
  const [validFrom, setValidFrom] = useState(slot?.validFrom ?? today())
  const [totalSessions, setTotalSessions] = useState(slot?.totalSessions?.toString() ?? "14")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!groupId || !zoneId || !startTime || !endTime || !validFrom || !totalSessions) {
      setError("All fields are required")
      return
    }
    if (endTime <= startTime) {
      setError("End time must be after start time")
      return
    }
    setSaving(true)
    setError("")

    const input = {
      groupId,
      zoneId,
      dayOfWeek,
      startTime,
      endTime,
      validFrom,
      totalSessions: Number(totalSessions),
    }
    const result = slot
      ? await updateTimetableSlotAction(slot.id, input)
      : await createTimetableSlotAction(input)

    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">
            {slot ? "Edit Weekly Slot" : "New Weekly Slot"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          Set the recurring day and time once — sessions get created automatically for every matching week.
        </p>

        {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Group</label>
            <select
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.courseCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Zone</label>
            <select
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
            >
              <option value="">Select a zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Day of week</label>
            <select
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start time</label>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End time</label>
              <input
                type="time"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Starts from</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Weeks to generate</label>
              <input
                type="number"
                min={1}
                max={52}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={totalSessions}
                onChange={(e) => setTotalSessions(e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-2">
            e.g. 14 weeks ≈ one semester of this class, every {DAYS.find((d) => d.value === dayOfWeek)?.label}.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !groupId || !zoneId || !startTime || !endTime || !validFrom || !totalSessions}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            {saving && <LoaderIcon className="size-3.5 animate-spin" />}
            {slot ? "Save changes" : "Create weekly slot"}
          </button>
        </div>
      </div>
    </div>
  )
}