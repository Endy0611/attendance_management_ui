"use client"

import { useState } from "react"
import { createZoneAction, updateZoneAction } from "@/actions/zone.action"
import type { ZoneResponse } from "@/types/zone-types"
import { LoaderIcon, XIcon } from "lucide-react"

interface ZoneFormDialogProps {
  zone: ZoneResponse | null
  onClose: () => void
  onSaved: () => void
}

export function ZoneFormDialog({ zone, onClose, onSaved }: ZoneFormDialogProps) {
  const [name, setName] = useState(zone?.name ?? "")
  const [latitude, setLatitude] = useState(zone?.latitude?.toString() ?? "")
  const [longitude, setLongitude] = useState(zone?.longitude?.toString() ?? "")
  const [radiusMeters, setRadiusMeters] = useState(zone?.radiusMeters?.toString() ?? "50")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const payload = {
      name,
      latitude: latitude.trim() ? Number(latitude) : undefined,
      longitude: longitude.trim() ? Number(longitude) : undefined,
      radiusMeters: radiusMeters.trim() ? Number(radiusMeters) : undefined,
    }

    const result = zone
      ? await updateZoneAction(zone.id, payload)
      : await createZoneAction(payload)

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
            {zone ? "Edit Zone" : "New Zone"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Zone name</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. Main Campus Building A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Latitude</label>
              <input
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                placeholder="e.g. 11.5564"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Longitude</label>
              <input
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                placeholder="e.g. 104.9282"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Check-in radius (meters)</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. 50"
              type="number"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            {saving && <LoaderIcon className="size-3.5 animate-spin" />}
            {zone ? "Save changes" : "Create zone"}
          </button>
        </div>
      </div>
    </div>
  )
}
