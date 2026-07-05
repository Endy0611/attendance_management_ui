"use client"

import { useState, useTransition } from "react"
import { getMajorsAction, deleteMajorAction } from "@/actions/major.action"
import { MajorFormDialog } from "@/components/majors/major-form-dialog"
import type { MajorResponse } from "@/types/major-types"
import { toastSuccess, toastError } from "@/lib/toast"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon, GraduationCapIcon } from "lucide-react"

export function MajorManager({ initialMajors }: { initialMajors: MajorResponse[] }) {
  const [majors, setMajors] = useState(initialMajors)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<MajorResponse | "create" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getMajorsAction()
      if (result.ok) setMajors(result.data)
    })
  }

  async function handleDelete(major: MajorResponse) {
    if (!confirm(`Delete major "${major.name}"? This cannot be undone.`)) return
    setDeletingId(major.id)
    const result = await deleteMajorAction(major.id)
    setDeletingId(null)

    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess("Major deleted")
    refresh()
  }

  const filtered = majors.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
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
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#1C4D8D" }}
        >
          <PlusIcon className="size-4" />
          New Major
        </button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-[#1C4D8D]/10 text-[#1C4D8D]">
            <GraduationCapIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No majors found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first major to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-[family-name:var(--font-mono)] bg-[#1C4D8D]/10 text-[#1C4D8D] px-2 py-0.5 rounded-md">
                    {m.code}
                  </span>
                  <p className="font-medium mt-1.5 truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.groupCount} group{m.groupCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setDialog(m)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    disabled={deletingId === m.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    {deletingId === m.id ? (
                      <LoaderIcon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">
                Added {new Date(m.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
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
    </div>
  )
}