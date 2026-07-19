"use client"

import { useState } from "react"
import { createTimetableSlotAction, updateTimetableSlotAction } from "@/actions/timetable.action"
import type { TimetableSlotResponse, DayOfWeek } from "@/types/timetable-types"
import type { GroupResponse } from "@/types/group-types"
import type { ZoneResponse } from "@/types/zone-types"
import { LoaderIcon, XIcon, CalendarClockIcon, RepeatIcon } from "lucide-react"

// Navy accent — matches the course, group, major & zone dialogs.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

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

  function focusRing(e: React.FocusEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = NAVY
    e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY_SOFT}`
  }
  function blurRing(e: React.FocusEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = ""
  }

  const fieldClass = "mt-1 w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
  const dayLabel = DAYS.find((d) => d.value === dayOfWeek)?.label
  const groupLabel = groups.find((g) => g.id === groupId)?.name
  const zoneLabel = zones.find((z) => z.id === zoneId)?.name

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="h-1.5 sticky top-0" style={{ backgroundColor: NAVY }} />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: NAVY }}
              >
                <CalendarClockIcon className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
                  {slot ? "Edit weekly slot" : "New weekly slot"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set the recurring day and time once — sessions generate automatically.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5 -mt-1.5">
              <XIcon className="size-4" />
            </button>
          </div>

          {error && <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Group</label>
              <select className={fieldClass} value={groupId} onChange={(e) => setGroupId(e.target.value)} onFocus={focusRing} onBlur={blurRing}>
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.courseCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Zone</label>
              <select className={fieldClass} value={zoneId} onChange={(e) => setZoneId(e.target.value)} onFocus={focusRing} onBlur={blurRing}>
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Day of week</label>
              <select className={fieldClass} value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)} onFocus={focusRing} onBlur={blurRing}>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start time</label>
                <input type="time" className={fieldClass} value={startTime} onChange={(e) => setStartTime(e.target.value)} onFocus={focusRing} onBlur={blurRing} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">End time</label>
                <input type="time" className={fieldClass} value={endTime} onChange={(e) => setEndTime(e.target.value)} onFocus={focusRing} onBlur={blurRing} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Starts from</label>
                <input type="date" className={fieldClass} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} onFocus={focusRing} onBlur={blurRing} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Weeks to generate</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  className={fieldClass}
                  value={totalSessions}
                  onChange={(e) => setTotalSessions(e.target.value)}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
              </div>
            </div>

            {/* Live plain-English summary of what's being configured */}
            <div className="flex items-start gap-2.5 rounded-xl p-3 text-xs leading-relaxed" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
              <RepeatIcon className="size-3.5 mt-0.5 shrink-0" />
              <p>
                {groupLabel ? <strong>{groupLabel}</strong> : "This group"} meets every{" "}
                <strong>{dayLabel}</strong>, <strong>{startTime}–{endTime}</strong>
                {zoneLabel ? <> at <strong>{zoneLabel}</strong></> : ""}, starting{" "}
                <strong>{validFrom}</strong>, for <strong>{totalSessions || "0"} week{totalSessions === "1" ? "" : "s"}</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-sm px-3.5 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !groupId || !zoneId || !startTime || !endTime || !validFrom || !totalSessions}
              className="min-w-28 flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : slot ? "Save changes" : "Create weekly slot"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}