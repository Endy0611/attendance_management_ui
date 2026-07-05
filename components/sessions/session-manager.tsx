"use client"

import { useState, useTransition } from "react"
import { getSessionsForRoleAction, deleteSessionAction } from "@/actions/session.action"
import { SessionFormDialog } from "@/components/sessions/session-form-dialog"
import { IfRole } from "@/components/role-guard"
import type { GroupSessionResponse } from "@/types/session-types"
import type { GroupResponse } from "@/types/group-types"
import type { ZoneResponse } from "@/types/zone-types"
import { toastSuccess, toastError } from "@/lib/toast"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon, CalendarIcon, CheckCircleIcon } from "lucide-react"

export function SessionManager({
  initialSessions,
  groups,
  zones,
}: {
  initialSessions: GroupSessionResponse[]
  groups: GroupResponse[]
  zones: ZoneResponse[]
}) {
  const [sessions, setSessions] = useState(initialSessions)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<GroupSessionResponse | "create" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getSessionsForRoleAction()
      if (result.ok) setSessions(result.data)
    })
  }

  async function handleDelete(session: GroupSessionResponse) {
    if (!confirm(`Delete this session for "${session.groupName ?? "an unnamed/deleted group"}"? This cannot be undone.`)) return
    setDeletingId(session.id)
    const result = await deleteSessionAction(session.id)
    setDeletingId(null)
    if (!result.ok) { toastError(result.error); return }
    toastSuccess("Session deleted")
    refresh()
  }

  const filtered = sessions.filter(
    (s) =>
      (s.groupName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.courseCode ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.zoneName ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const active = filtered.filter((s) => s.active)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <IfRole allow={["ADMIN", "INSTRUCTOR"]}>
          <button
            onClick={() => setDialog("create")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            <PlusIcon className="size-4" />
            New Session
          </button>
        </IfRole>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
          placeholder="Search by group, course, or zone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isRefreshing && filtered.length === 0 ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-[#1C4D8D]/10 text-[#1C4D8D]">
            <CalendarIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No sessions found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first session to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-green-600" /> Active now ({active.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onEdit={() => setDialog(s)}
                    onDelete={() => handleDelete(s)}
                    deleting={deletingId === s.id}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">All sessions</h2>
            <div className="rounded-2xl border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {["Group", "Course", "Zone", "Start", "End", "Status", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">
                        {s.groupName ?? <span className="italic text-rose-500">Deleted group</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.courseCode ?? <span className="italic text-rose-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.zoneName ?? <span className="italic text-rose-400">Deleted zone</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(s.startTime).toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(s.endTime).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {s.active ? "Active" : "Ended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <IfRole allow={["ADMIN", "INSTRUCTOR"]}>
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setDialog(s)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                              <PencilIcon className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deletingId === s.id}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                            >
                              {deletingId === s.id ? <LoaderIcon className="size-3.5 animate-spin" /> : <TrashIcon className="size-3.5" />}
                            </button>
                          </div>
                        </IfRole>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {dialog && (
        <SessionFormDialog
          session={dialog === "create" ? null : dialog}
          groups={groups}
          zones={zones}
          onClose={() => setDialog(null)}
          onSaved={() => {
            toastSuccess(dialog === "create" ? "Session created" : "Session updated")
            setDialog(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function SessionCard({
  session: s,
  onEdit,
  onDelete,
  deleting,
}: {
  session: GroupSessionResponse
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium truncate">
          {s.groupName ?? <span className="italic text-rose-500">Deleted group</span>}
        </p>
        <IfRole allow={["ADMIN", "INSTRUCTOR"]}>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
              <PencilIcon className="size-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600">
              {deleting ? <LoaderIcon className="size-3.5 animate-spin" /> : <TrashIcon className="size-3.5" />}
            </button>
          </div>
        </IfRole>
      </div>
      <p className="text-xs text-muted-foreground">{s.courseCode ?? "—"} · {s.zoneName ?? "Deleted zone"}</p>
      <p className="text-xs text-muted-foreground">
        {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} → {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  )
}