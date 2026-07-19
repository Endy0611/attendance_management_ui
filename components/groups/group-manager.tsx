"use client"

import { useState, useTransition } from "react"
import { getMyGroupsAction, deleteGroupAction } from "@/actions/group.action"
import { GroupFormDialog } from "@/components/groups/group-form-dialog"
import { GroupMembersDialog } from "@/components/groups/group-members-dialog"
import { IfRole } from "@/components/role-guard"
import type { GroupResponse } from "@/types/group-types"
import { toastSuccess, toastError } from "@/lib/toast"
import {
  PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon,
  LayersIcon, UsersIcon, AlertTriangleIcon, UserRoundPlusIcon,
} from "lucide-react"

// Navy accent — matches the course dialog colors.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

function fillTone(pct: number) {
  if (pct >= 100) return "#E11D48"
  if (pct >= 80) return "#F59E0B"
  return NAVY
}

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

export function GroupManager({ initialGroups }: { initialGroups: GroupResponse[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<GroupResponse | "create" | null>(null)
  const [membersDialog, setMembersDialog] = useState<GroupResponse | null>(null)
  const [toDelete, setToDelete] = useState<GroupResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getMyGroupsAction()
      if (result.ok) setGroups(result.data)
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteGroupAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess("Group deleted")
    refresh()
  }

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      g.instructorName.toLowerCase().includes(search.toLowerCase())
  )

  const totalStudents = groups.reduce((a, g) => a + g.memberCount, 0)
  const avgFill = groups.length > 0
    ? Math.round(groups.reduce((a, g) => a + (g.capacity ? g.memberCount / g.capacity : 0), 0) / groups.length * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Groups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} group{groups.length === 1 ? "" : "s"}
          </p>
        </div>
        <IfRole allow={["ADMIN"]}>
          <button
            onClick={() => setDialog("create")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: NAVY }}
          >
            <PlusIcon className="size-4" />
            New Group
          </button>
        </IfRole>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Groups", value: groups.length, icon: <LayersIcon className="size-3.5" /> },
          { label: "Students enrolled", value: totalStudents, icon: <UsersIcon className="size-3.5" /> },
          { label: "Avg. capacity used", value: `${avgFill}%`, icon: <UsersIcon className="size-3.5" /> },
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
          placeholder="Search by name, course, or instructor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
            <LayersIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No groups found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first group to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g, i) => {
            const fillPct = g.capacity ? Math.min(100, Math.round((g.memberCount / g.capacity) * 100)) : 0
            const tone = fillTone(fillPct)
            return (
              <div
                key={g.id}
                className="group rounded-2xl border bg-card p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${i * 40}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className="text-xs font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: NAVY_SOFT, color: NAVY }}
                    >
                      {g.courseCode}
                    </span>
                    <p className="font-medium mt-1.5 truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.instructorName}</p>
                    {(g.majorName || g.shift) && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[g.majorName, g.shift].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <IfRole allow={["ADMIN"]}>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDialog(g)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setToDelete(g)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    </div>
                  </IfRole>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: tone }}>{g.memberCount}/{g.capacity ?? "—"} students</span>
                    {g.semester && <span className="text-muted-foreground font-[family-name:var(--font-mono)]">{g.semester}</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${fillPct}%`, backgroundColor: tone }}
                    />
                  </div>
                </div>

                <IfRole allow={["ADMIN", "INSTRUCTOR"]}>
                  <button
                    onClick={() => setMembersDialog(g)}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:text-white"
                    style={{ borderColor: NAVY, color: NAVY }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <UserRoundPlusIcon className="size-3.5" />
                    Add / manage members
                  </button>
                </IfRole>
              </div>
            )
          })}
        </div>
      )}

      {dialog && (
        <GroupFormDialog
          group={dialog === "create" ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            toastSuccess(dialog === "create" ? "Group created" : "Group updated")
            setDialog(null)
            refresh()
          }}
        />
      )}

      {membersDialog && (
        <GroupMembersDialog group={membersDialog} onClose={() => { setMembersDialog(null); refresh() }} />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Delete group "${toDelete.name}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}