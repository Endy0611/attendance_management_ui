"use client"

import { useState } from "react"
import { createSessionAction, updateSessionAction } from "@/actions/session.action"
import type { GroupSessionResponse } from "@/types/session-types"
import type { GroupResponse } from "@/types/group-types"
import type { ZoneResponse } from "@/types/zone-types"
import { LoaderIcon, XIcon } from "lucide-react"

interface SessionFormDialogProps {
  session: GroupSessionResponse | null
  groups: GroupResponse[]
  zones: ZoneResponse[]
  onClose: () => void
  onSaved: () => void
}

// The backend stores start/end time as a naive local timestamp (no timezone
// offset attached) — it's the wall-clock time the class actually happens at,
// not a UTC instant. `new Date(x).toISOString()` was converting the value
// the user typed (e.g. 12:55) into UTC before sending it (e.g. 05:55 for a
// UTC+7 browser), which the backend then stored *as if* 05:55 were the local
// time — so every session displayed 7 hours earlier than what was typed.
// Fix: never round-trip through toISOString()/Date for this field. Take the
// <input type="datetime-local"> value exactly as typed and just append
// seconds, so the string that leaves the browser is the same wall-clock time
// that went in.
function toBackendDateTime(localInputValue: string) {
  // localInputValue is "YYYY-MM-DDTHH:mm" straight from the input — already
  // naive/local with no timezone info to strip or convert.
  return localInputValue.length === 16 ? `${localInputValue}:00` : localInputValue
}

// Reverse of the above for populating the edit form: pull the first 16 chars
// (YYYY-MM-DDTHH:mm) regardless of whether the backend value has seconds,
// milliseconds, or (from old/legacy rows) a trailing "Z" — we deliberately
// ignore any "Z"/offset suffix rather than letting `new Date()` apply a
// timezone conversion, since the value is meant to be read as local wall-clock
// time either way.
function toLocalInput(raw: string) {
  if (!raw) return ""
  const naive = raw.replace(/Z$/, "")
  return naive.slice(0, 16)
}

export function SessionFormDialog({ session, groups, zones, onClose, onSaved }: SessionFormDialogProps) {
  const [groupId, setGroupId] = useState(session?.groupId ?? "")
  const [zoneId, setZoneId] = useState(session?.zoneId ?? "")
  const [startTime, setStartTime] = useState(toLocalInput(session?.startTime ?? ""))
  const [endTime, setEndTime] = useState(toLocalInput(session?.endTime ?? ""))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (!groupId || !zoneId || !startTime || !endTime) {
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
      startTime: toBackendDateTime(startTime),
      endTime: toBackendDateTime(endTime),
    }
    const result = session ? await updateSessionAction(session.id, input) : await createSessionAction(input)

    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">
            {session ? "Edit Session" : "New Session"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start time</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End time</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !groupId || !zoneId || !startTime || !endTime}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            {saving && <LoaderIcon className="size-3.5 animate-spin" />}
            {session ? "Save changes" : "Create session"}
          </button>
        </div>
      </div>
    </div>
  )
}