"use client"

import { useState } from "react"
import { createZoneAction, updateZoneAction } from "@/actions/zone.action"
import type { ZoneResponse } from "@/types/zone-types"
import { LoaderIcon, XIcon, MapPinIcon, LocateFixedIcon } from "lucide-react"

// Navy accent — matches the course, group & major dialogs.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

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
  const [locating, setLocating] = useState(false)
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

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.")
      return
    }
    setLocating(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6))
        setLongitude(pos.coords.longitude.toFixed(6))
        setLocating(false)
      },
      () => {
        setError("Couldn't get your location — enter coordinates manually.")
        setLocating(false)
      }
    )
  }

  function focusRing(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = NAVY
    e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY_SOFT}`
  }
  function blurRing(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = ""
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="h-1.5" style={{ backgroundColor: NAVY }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: NAVY }}
              >
                <MapPinIcon className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
                  {zone ? "Edit zone" : "New zone"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {zone ? "Update geofence details" : "Define a check-in geofence"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5 -mt-1.5">
              <XIcon className="size-4" />
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="space-y-3.5">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Zone name</span>
              <input
                className="w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="e.g. Main Campus Building A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={focusRing}
                onBlur={blurRing}
              />
            </label>

            <div className="rounded-xl border p-3 space-y-2.5" style={{ backgroundColor: NAVY_SOFT }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Coordinates</span>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex items-center gap-1 text-xs font-medium disabled:opacity-60"
                  style={{ color: NAVY }}
                >
                  {locating ? <LoaderIcon className="size-3 animate-spin" /> : <LocateFixedIcon className="size-3" />}
                  Use my location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted-foreground">Latitude</label>
                  <input
                    className="mt-1 w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                    placeholder="e.g. 11.5564"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Longitude</label>
                  <input
                    className="mt-1 w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                    placeholder="e.g. 104.9282"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                </div>
              </div>
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Check-in radius</span>
              <div className="relative">
                <input
                  className="w-full rounded-lg border-2 bg-background px-3 py-2 pr-12 text-sm outline-none focus:ring-2"
                  placeholder="e.g. 50"
                  type="number"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">meters</span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="text-sm px-3.5 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="min-w-28 flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : zone ? "Save changes" : "Create zone"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}