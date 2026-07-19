"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getGroupMembersAction,
  getStudentOptionsAction,
  addGroupMembersAction,
  removeGroupMemberAction,
} from "@/actions/group.action"
import type { GroupResponse, GroupMemberResponse } from "@/types/group-types"
import type { AppUserResponse } from "@/types/auth-types"
import {
  XIcon, LoaderIcon, UserPlusIcon, TrashIcon, UsersIcon,
  SearchIcon, CheckIcon, UserRoundPlusIcon, UserRoundXIcon,
} from "lucide-react"

// Navy accent — matches the course dialog colors.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
}

// Color feedback for how full the group is.
function fillTone(pct: number) {
  if (pct >= 100) return "#E11D48" // rose — full
  if (pct >= 80) return "#F59E0B" // amber — nearly full
  return NAVY // healthy
}

type Tab = "members" | "add"

export function GroupMembersDialog({ group, onClose }: { group: GroupResponse; onClose: () => void }) {
  const [members, setMembers] = useState<GroupMemberResponse[]>([])
  const [candidates, setCandidates] = useState<AppUserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("members")
  const [query, setQuery] = useState("")
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

  const memberIds = useMemo(() => new Set(members.map((m) => m.studentId)), [members])
  const available = useMemo(() => candidates.filter((c) => !memberIds.has(c.id)), [candidates, memberIds])

  const fillPct = group.capacity ? Math.min(100, Math.round((members.length / group.capacity) * 100)) : 0
  const tone = fillTone(fillPct)
  const spotsLeft = group.capacity != null ? Math.max(0, group.capacity - members.length) : null

  const filteredMembers = members.filter((m) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return m.studentName.toLowerCase().includes(q) || (m.studentNumber ?? m.studentEmail).toLowerCase().includes(q)
  })

  const filteredCandidates = available.filter((c) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || (c.studentId ?? c.email).toLowerCase().includes(q)
  })

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function switchTab(next: Tab) {
    setTab(next)
    setQuery("")
    if (next === "members") setSelected([])
  }

  async function handleAdd() {
    if (selected.length === 0) return
    setAdding(true)
    setError("")
    const result = await addGroupMembersAction(group.id, selected)
    setAdding(false)
    if (!result.ok) { setError(result.error); return }
    setSelected([])
    setQuery("")
    setTab("members")
    load()
  }

  async function handleRemove(studentId: string) {
    setRemovingId(studentId)
    const result = await removeGroupMemberAction(group.id, studentId)
    setRemovingId(null)
    if (!result.ok) { setError(result.error); return }
    load()
  }

  const selectedCandidates = candidates.filter((c) => selected.includes(c.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="shrink-0 p-5 pb-4 border-b space-y-4" style={{ background: `linear-gradient(180deg, ${NAVY_SOFT}, transparent)` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ backgroundColor: NAVY }}>
                <UsersIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight truncate font-[family-name:var(--font-display)]">
                  {group.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Manage who's enrolled</p>
              </div>
            </div>
            <button onClick={onClose} className="icon-btn shrink-0 -mr-1 -mt-1">
              <XIcon className="size-4" />
            </button>
          </div>

          {/* Capacity readout */}
          <div>
            <div className="flex justify-between items-baseline text-xs mb-1.5">
              <span className="font-medium" style={{ color: tone }}>
                {members.length}{group.capacity != null ? ` / ${group.capacity}` : ""} students
              </span>
              {spotsLeft !== null && (
                <span className="text-muted-foreground">
                  {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Full"}
                </span>
              )}
            </div>
            {group.capacity != null && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${fillPct}%`, backgroundColor: tone }} />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <button
              onClick={() => switchTab("members")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors"
              style={tab === "members" ? { backgroundColor: "var(--card, #fff)", color: NAVY } : { color: "var(--muted-foreground)" }}
            >
              <UsersIcon className="size-3.5" />
              Members
              <span className="text-[10px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: tab === "members" ? NAVY_SOFT : "transparent" }}>
                {members.length}
              </span>
            </button>
            <button
              onClick={() => switchTab("add")}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors"
              style={tab === "add" ? { backgroundColor: "var(--card, #fff)", color: NAVY } : { color: "var(--muted-foreground)" }}
            >
              <UserRoundPlusIcon className="size-3.5" />
              Add students
              {spotsLeft === 0 && <span className="text-[10px] text-amber-600">(full)</span>}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              className="w-full rounded-lg border-2 bg-background pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2"
              style={{ borderColor: query ? NAVY : undefined, boxShadow: query ? `0 0 0 3px ${NAVY_SOFT}` : undefined }}
              placeholder={tab === "members" ? "Search current members…" : "Search students to add…"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="mx-5 mt-3 text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2 shrink-0">{error}</p>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : tab === "members" ? (
            filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
                <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
                  <UsersIcon className="size-5" />
                </div>
                <p className="text-sm font-medium">{query ? "No matches" : "No students yet"}</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  {query ? "Try a different name or ID." : "Switch to the Add students tab to enroll your first student."}
                </p>
                {!query && (
                  <button
                    onClick={() => switchTab("add")}
                    className="mt-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    Add students
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredMembers.map((m) => (
                  <div key={m.studentId} className="group flex items-center gap-3 text-sm border rounded-xl px-3 py-2 hover:bg-muted/40 transition-colors">
                    <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0" style={{ backgroundColor: NAVY }}>
                      {initials(m.studentName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{m.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.studentNumber ?? m.studentEmail}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(m.studentId)}
                      disabled={removingId === m.studentId}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 shrink-0 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove"
                    >
                      {removingId === m.studentId ? <LoaderIcon className="size-3.5 animate-spin" /> : <TrashIcon className="size-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
              <div className="p-3 rounded-xl" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
                <UserRoundXIcon className="size-5" />
              </div>
              <p className="text-sm font-medium">{query ? "No matches" : "Everyone's already in"}</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                {query ? "Try a different name or ID." : "All available students are already members of this group."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredCandidates.map((c) => {
                const isSelected = selected.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelected(c.id)}
                    className="w-full flex items-center gap-3 text-sm border rounded-xl px-3 py-2 text-left transition-colors"
                    style={isSelected ? { backgroundColor: NAVY_SOFT, borderColor: NAVY } : undefined}
                  >
                    <div
                      className="size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={isSelected ? { backgroundColor: NAVY, borderColor: NAVY } : { borderColor: "var(--border, #d4d4d8)" }}
                    >
                      {isSelected && <CheckIcon className="size-3.5 text-white" />}
                    </div>
                    <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0 bg-muted-foreground/40">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.studentId ?? c.email}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Sticky add footer — only shown while adding */}
        {tab === "add" && (
          <div className="shrink-0 border-t p-4 space-y-2.5 bg-card">
            {selectedCandidates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {selectedCandidates.map((c) => (
                  <span key={c.id} className="flex items-center gap-1 text-[11px] font-medium pl-2 pr-1 py-1 rounded-full" style={{ backgroundColor: NAVY_SOFT, color: NAVY }}>
                    {c.name}
                    <button onClick={() => toggleSelected(c.id)} className="p-0.5 rounded-full hover:bg-black/10">
                      <XIcon className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={adding || selected.length === 0}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-2.5 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {adding ? <LoaderIcon className="size-4 animate-spin" /> : <UserPlusIcon className="size-4" />}
              {selected.length > 0 ? `Add ${selected.length} student${selected.length === 1 ? "" : "s"}` : "Select students to add"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}