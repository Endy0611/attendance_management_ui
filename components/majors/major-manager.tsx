"use client"

import { useState, useTransition } from "react"
import { getMajorsAction, deleteMajorAction } from "@/actions/major.action"
import { MajorFormDialog } from "@/components/majors/major-form-dialog"
import type { MajorResponse } from "@/types/major-types"
import { toastSuccess, toastError } from "@/lib/toast"
import {
  PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon,
  GraduationCapIcon, AlertTriangleIcon, LayersIcon,
} from "lucide-react"

// Navy accent — matches the course & group dialogs.
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

export function MajorManager({ initialMajors }: { initialMajors: MajorResponse[] }) {
  const [majors, setMajors] = useState(initialMajors)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<MajorResponse | "create" | null>(null)
  const [toDelete, setToDelete] = useState<MajorResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getMajorsAction()
      if (result.ok) setMajors(result.data)
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteMajorAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess("Major deleted")
    refresh()
  }

  const filtered = majors.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalGroups = majors.reduce((a, m) => a + m.groupCount, 0)
  const emptyMajors = majors.filter((m) => m.groupCount === 0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Majors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {majors.length} major{majors.length === 1 ? "" : "s"} total
          </p>
        </div>
        <button
          onClick={() => setDialog("create")}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <PlusIcon className="size-4" />
          New Major
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Majors", value: majors.length, icon: <GraduationCapIcon className="size-3.5" /> },
          { label: "Groups across majors", value: totalGroups, icon: <LayersIcon className="size-3.5" /> },
          { label: "Without groups yet", value: emptyMajors, icon: <GraduationCapIcon className="size-3.5" /> },
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
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
            <GraduationCapIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No majors found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first major to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => {
            const hasGroups = m.groupCount > 0
            return (
              <div
                key={m.id}
                className="group rounded-2xl border bg-card p-4 flex flex-col gap-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${i * 40}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="text-xs font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: NAVY_SOFT, color: NAVY }}
                    >
                      {m.code}
                    </span>
                    <p className="font-medium mt-1.5 truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.groupCount} group{m.groupCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setDialog(m)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      onClick={() => !hasGroups && setToDelete(m)}
                      disabled={hasGroups}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      title={hasGroups ? "Move or remove its groups first" : "Delete"}
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">
                  Added {new Date(m.createdAt).toLocaleDateString()}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {dialog && (
        <MajorFormDialog
          major={dialog === "create" ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            toastSuccess(dialog === "create" ? "Major created" : "Major updated")
            setDialog(null)
            refresh()
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Delete major "${toDelete.name}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}