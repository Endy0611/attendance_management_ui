"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { sessionApi, groupApi, zoneApi } from "@/lib/api"
import type { Session, Group, Zone } from "@/lib/api"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, CheckCircleIcon, ClockIcon } from "lucide-react"
import { useAuthStore } from "@/store/auth.store"

function SessionModal({ session, groups, zones, onClose, onSaved }: {
  session: Session | null; groups: Group[]; zones: Zone[]
  onClose: () => void; onSaved: () => void
}) {
  const fmt = (iso: string) => iso ? iso.slice(0, 16) : ""
  const [groupId,   setGroupId]   = useState(session?.groupId ?? "")
  const [zoneId,    setZoneId]    = useState(session?.zoneId  ?? "")
  const [startTime, setStartTime] = useState(fmt(session?.startTime ?? ""))
  const [endTime,   setEndTime]   = useState(fmt(session?.endTime   ?? ""))
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")

  async function handleSubmit() {
    if (!groupId || !zoneId || !startTime || !endTime) { setError("All fields are required"); return }
    setSaving(true); setError("")
    try {
      const body = { groupId, zoneId, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString() }
      session ? await sessionApi.update(session.id, body) : await sessionApi.create(body)
      onSaved()
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">{session ? "Edit Session" : "Create Session"}</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <select className="input w-full" value={groupId} onChange={e => setGroupId(e.target.value)}>
          <option value="">Select group *</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.courseCode})</option>)}
        </select>
        <select className="input w-full" value={zoneId} onChange={e => setZoneId(e.target.value)}>
          <option value="">Select zone *</option>
          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Start time *</label>
            <input className="input w-full" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">End time *</label>
            <input className="input w-full" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <LoaderIcon className="size-4 animate-spin" /> : session ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const user = useAuthStore((s) => s.user)
  const [sessions, setSessions] = useState<Session[]>([])
  const [groups,   setGroups]   = useState<Group[]>([])
  const [zones,    setZones]    = useState<Zone[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<Session | "create" | null>(null)
  const [toast,    setToast]    = useState("")

  const isAdmin      = user?.role === "ADMIN"
  const isInstructor = user?.role === "INSTRUCTOR"

  const load = async () => {
    setLoading(true)
    try {
      const s = isAdmin ? await sessionApi.list() : await sessionApi.myAll()
      setSessions(s)
      if (isAdmin || isInstructor) {
        const [g, z] = await Promise.all([
          isAdmin ? groupApi.list() : groupApi.myGroups(),
          zoneApi.list(),
        ])
        setGroups(g); setZones(z)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user])
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000) }

  async function handleDelete(s: Session) {
    if (!confirm(`Delete this session for ${s.groupName}?`)) return
    try { await sessionApi.remove(s.id); load(); showToast("Session deleted") }
    catch (e: any) { showToast(e.message) }
  }

  const active  = sessions.filter(s => s.active)
  const past    = sessions.filter(s => !s.active)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Sessions</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Sessions</h1>
            {(isAdmin || isInstructor) && (
              <button onClick={() => setModal("create")} className="btn-primary flex items-center gap-2">
                <PlusIcon className="size-4" /> Create Session
              </button>
            )}
          </div>

          {loading
            ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
            : (
              <div className="space-y-6">
                {active.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <CheckCircleIcon className="size-4 text-green-600" /> Active Now ({active.length})
                    </h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {active.map(s => <SessionCard key={s.id} session={s} onEdit={() => setModal(s)} onDelete={() => handleDelete(s)} canEdit={isAdmin || isInstructor} />)}
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <ClockIcon className="size-4" /> All Sessions ({sessions.length})
                  </h2>
                  <div className="rounded-xl border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          {["Group", "Course", "Zone", "Start", "End", "Status", "Actions"].map(h => (
                            <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map(s => (
                          <tr key={s.id} className="border-t hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{s.groupName}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.courseCode}</td>
                            <td className="px-4 py-3 text-muted-foreground">{s.zoneName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(s.startTime).toLocaleString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{new Date(s.endTime).toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                                {s.active ? "Active" : "Ended"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {(isAdmin || isInstructor) && (
                                <div className="flex gap-1">
                                  <button onClick={() => setModal(s)} className="icon-btn"><PencilIcon className="size-4" /></button>
                                  <button onClick={() => handleDelete(s)} className="icon-btn"><TrashIcon className="size-4 text-red-600" /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sessions.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No sessions yet.</p>}
                  </div>
                </div>
              </div>
            )}
        </main>
      </SidebarInset>

      {modal && (isAdmin || isInstructor) && (
        <SessionModal
          session={modal === "create" ? null : modal}
          groups={groups} zones={zones}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); showToast(modal === "create" ? "Session created" : "Session updated") }}
        />
      )}
      {toast && <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-sm px-4 py-2 rounded-lg shadow-lg">{toast}</div>}
    </SidebarProvider>
  )
}

function SessionCard({ session: s, onEdit, onDelete, canEdit }: {
  session: Session; onEdit: () => void; onDelete: () => void; canEdit: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <div className="flex justify-between">
        <p className="font-medium">{s.groupName}</p>
        {canEdit && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="icon-btn"><PencilIcon className="size-4" /></button>
            <button onClick={onDelete} className="icon-btn"><TrashIcon className="size-4 text-red-600" /></button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{s.courseCode} · {s.zoneName}</p>
      <p className="text-xs">{new Date(s.startTime).toLocaleTimeString()} → {new Date(s.endTime).toLocaleTimeString()}</p>
    </div>
  )
}