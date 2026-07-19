"use client"

import { useState, useTransition } from "react"
import { getZonesAction, deleteZoneAction } from "@/actions/zone.action"
import { ZoneFormDialog } from "@/components/zones/zone-form-dialog"
import type { ZoneResponse } from "@/types/zone-types"
import { toastSuccess, toastError } from "@/lib/toast"
import {
  PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon,
  MapPinIcon, AlertTriangleIcon, RadarIcon, ExternalLinkIcon,
} from "lucide-react"

// Navy accent — matches the course, group & major dialogs.
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

export function ZoneManager({ initialZones }: { initialZones: ZoneResponse[] }) {
  const [zones, setZones] = useState(initialZones)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<ZoneResponse | "create" | null>(null)
  const [toDelete, setToDelete] = useState<ZoneResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getZonesAction()
      if (result.ok) setZones(result.data)
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteZoneAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess("Zone deleted")
    refresh()
  }

  const filtered = zones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))

  const withCoords = zones.filter((z) => z.latitude != null && z.longitude != null)
  const avgRadius = withCoords.length > 0
    ? Math.round(withCoords.reduce((a, z) => a + (z.radiusMeters ?? 0), 0) / withCoords.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Zones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {zones.length} zone{zones.length === 1 ? "" : "s"} · used as geofences for session check-in
          </p>
        </div>
        <button
          onClick={() => setDialog("create")}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <PlusIcon className="size-4" />
          New Zone
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Zones", value: zones.length, icon: <MapPinIcon className="size-3.5" /> },
          { label: "With coordinates", value: withCoords.length, icon: <RadarIcon className="size-3.5" /> },
          { label: "Avg. radius", value: avgRadius ? `${avgRadius} m` : "—", icon: <RadarIcon className="size-3.5" /> },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border-2 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2"
          style={{ borderColor: search ? NAVY : undefined, boxShadow: search ? `0 0 0 3px ${NAVY_SOFT}` : undefined }}
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
            <MapPinIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No zones found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first zone to enable location-based check-in."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((z, i) => {
            const hasCoords = z.latitude != null && z.longitude != null
            return (
              <div
                key={z.id}
                className="group rounded-2xl border bg-card p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${i * 40}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
                      <MapPinIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{z.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-[family-name:var(--font-mono)]">
                        {hasCoords ? `${z.latitude!.toFixed(5)}, ${z.longitude!.toFixed(5)}` : "No coordinates set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setDialog(z)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setToDelete(z)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <RadarIcon className="size-3" />
                    {z.radiusMeters ?? "—"} m radius
                  </span>
                  {hasCoords ? (
                    <a
                      href={`https://maps.google.com/?q=${z.latitude},${z.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-medium hover:underline"
                      style={{ color: NAVY }}
                    >
                      View on map
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  ) : (
                    <span className="font-[family-name:var(--font-mono)] text-muted-foreground">
                      {new Date(z.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {z.createdByName && (
                  <p className="text-[11px] text-muted-foreground -mt-1.5">Created by {z.createdByName}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {dialog && (
        <ZoneFormDialog
          zone={dialog === "create" ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            toastSuccess(dialog === "create" ? "Zone created" : "Zone updated")
            setDialog(null)
            refresh()
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Delete zone "${toDelete.name}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}