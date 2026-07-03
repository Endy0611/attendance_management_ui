"use client"

import { useEffect, useState } from "react"
import {
  getGroupMembersAction,
  getStudentOptionsAction,
  addGroupMembersAction,
  removeGroupMemberAction,
} from "@/actions/group.action"
import type { GroupResponse, GroupMemberResponse } from "@/types/group-types"
import type { AppUserResponse } from "@/types/auth-types"
import { XIcon, LoaderIcon, UserPlusIcon, TrashIcon } from "lucide-react"

export function GroupMembersDialog({ group, onClose }: { group: GroupResponse; onClose: () => void }) {
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [candidates, setCandidates] = useState<AppUserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    const [m, s] = await Promise.all([getGroupMembersAction(group.id), getStudentOptionsAction()])
    if (m.ok) setMembers(m.data)
    if (s.ok) setCandidates(s.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const memberIds = new Set(members.map((m) => m.studentId))
  const available = candidates.filter((c) => !memberIds.has(c.id))

  async function handleAdd() {
    if (selected.length === 0) return
    setAdding(true)
    setError("")
    const result = await addGroupMembersAction(group.id, selected)
    setAdding(false)
    if (!result.ok) { setError(result.error); return }
    setSelected([])
    load()
  }

  async function handleRemove(studentId: string) {
    setRemovingId(studentId)
    const result = await removeGroupMemberAction(group.id, studentId)
    setRemovingId(null)
    if (!result.ok) { setError(result.error); return }
    load()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">Members</h2>
            <p className="text-xs text-muted-foreground">{group.name} · {members.length}/{group.capacity}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

        {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2">
          <select
            multiple
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30 h-24"
            value={selected}
            onChange={(e) => setSelected(Array.from(e.target.selectedOptions, (o) => o.value))}
          >
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.name} — {s.studentId ?? s.email}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || selected.length === 0}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: "#1C4D8D" }}
        >
          {adding ? <LoaderIcon className="size-3.5 animate-spin" /> : <UserPlusIcon className="size-3.5" />}
          Add {selected.length > 0 ? `${selected.length} student${selected.length === 1 ? "" : "s"}` : "students"}
        </button>

        <div className="border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Current members</p>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students in this group yet.</p>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.studentId} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.studentName}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.studentNumber ?? m.studentEmail}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(m.studentId)}
                    disabled={removingId === m.studentId}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 shrink-0"
                  >
                    {removingId === m.studentId
                      ? <LoaderIcon className="size-3.5 animate-spin" />
                      : <TrashIcon className="size-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}