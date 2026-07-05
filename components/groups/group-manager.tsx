"use client"

import { useState, useTransition } from "react"
import { getMyGroupsAction, deleteGroupAction } from "@/actions/group.action"
import { GroupFormDialog } from "@/components/groups/group-form-dialog"
import { GroupMembersDialog } from "@/components/groups/group-members-dialog"
import { IfRole } from "@/components/role-guard"
import type { GroupResponse } from "@/types/group-types"
import { toastSuccess, toastError } from "@/lib/toast"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon, LayersIcon, UsersIcon } from "lucide-react"

export function GroupManager({ initialGroups }: { initialGroups: GroupResponse[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<GroupResponse | "create" | null>(null)
  const [membersDialog, setMembersDialog] = useState<GroupResponse | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getMyGroupsAction()
      if (result.ok) setGroups(result.data)
    })
  }

  async function handleDelete(group: GroupResponse) {
    if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return
    setDeletingId(group.id)
    const result = await deleteGroupAction(group.id)
    setDeletingId(null)
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

  return (
    <div className="space-y-6">
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
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            <PlusIcon className="size-4" />
            New Group
          </button>
        </IfRole>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
          placeholder="Search by name, course, or instructor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-violet-100 text-violet-600">
            <LayersIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No groups found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first group to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <div key={g.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-[family-name:var(--font-mono)] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md">
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
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setDialog(g)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                      <PencilIcon className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g)}
                      disabled={deletingId === g.id}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                    >
                      {deletingId === g.id ? <LoaderIcon className="size-3.5 animate-spin" /> : <TrashIcon className="size-3.5" />}
                    </button>
                  </div>
                </IfRole>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{g.memberCount}/{g.capacity ?? "—"} students</span>
                    {g.semester && <span className="text-muted-foreground font-[family-name:var(--font-mono)]">{g.semester}</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${g.capacity ? Math.min(100, (g.memberCount / g.capacity) * 100) : 0}%`, backgroundColor: "#7C3AED" }}
                    />
                  </div>
                </div>
              </div>

              <IfRole allow={["ADMIN", "INSTRUCTOR"]}>
                <button
                  onClick={() => setMembersDialog(g)}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-muted"
                >
                  <UsersIcon className="size-3.5" />
                  Manage members
                </button>
              </IfRole>
            </div>
          ))}
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
    </div>
  )
}