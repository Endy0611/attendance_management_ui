"use client"

import { useState, useTransition } from "react"
import { getZonesAction, deleteZoneAction } from "@/actions/zone.action"
import { ZoneFormDialog } from "@/components/zones/zone-form-dialog"
import type { ZoneResponse } from "@/types/zone-types"
import { toastSuccess, toastError } from "@/lib/toast"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon, MapPinIcon } from "lucide-react"

export function ZoneManager({ initialZones }: { initialZones: ZoneResponse[] }) {
  const [zones, setZones] = useState(initialZones)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<ZoneResponse | "create" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getZonesAction()
      if (result.ok) setZones(result.data)
    })
  }

  async function handleDelete(zone: ZoneResponse) {
    if (!confirm(`Delete zone "${zone.name}"? This cannot be undone.`)) return
    setDeletingId(zone.id)
    const result = await deleteZoneAction(zone.id)
    setDeletingId(null)

    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess("Zone deleted")
    refresh()
  }

  const filtered = zones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
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
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#1C4D8D" }}
        >
          <PlusIcon className="size-4" />
          New Zone
        </button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-[#1C4D8D]/10 text-[#1C4D8D]">
            <MapPinIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No zones found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first zone to enable location-based check-in."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((z) => (
            <div key={z.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2">
                  <div className="p-1.5 rounded-lg bg-[#1C4D8D]/10 text-[#1C4D8D] shrink-0">
                    <MapPinIcon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{z.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-[family-name:var(--font-mono)]">
                      {z.latitude?.toFixed(5) ?? "—"}, {z.longitude?.toFixed(5) ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setDialog(z)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(z)}
                    disabled={deletingId === z.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    {deletingId === z.id ? (
                      <LoaderIcon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Radius: {z.radiusMeters ?? "—"} m</span>
                <span className="font-[family-name:var(--font-mono)]">
                  {new Date(z.createdAt).toLocaleDateString()}
                </span>
              </div>
              {z.createdByName && (
                <p className="text-[11px] text-muted-foreground -mt-1">Created by {z.createdByName}</p>
              )}
            </div>
          ))}
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
    </div>
  )
}