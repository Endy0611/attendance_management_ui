"use client"

import { useState, useTransition } from "react"
import {
  getUsersAction, createUserAction, updateUserAction, deleteUserAction,
  setUserActiveAction, resetUserPasswordAction, resetUserDeviceAction,
} from "@/actions/admin.action"
import { faceApi } from "@/lib/api"
import { toastSuccess, toastError } from "@/lib/toast"
import type { AppUserResponse } from "@/types/auth-types"
import {
  PlusIcon, PencilIcon, TrashIcon, ShieldOffIcon, ShieldCheckIcon,
  KeyRoundIcon, SmartphoneIcon, ScanFaceIcon, SearchIcon, LoaderIcon,
} from "lucide-react"

type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT"

const ROLE_COLORS: Record<Role, string> = {
  ADMIN:      "bg-rose-100 text-rose-700",
  INSTRUCTOR: "bg-amber-100 text-amber-700",
  STUDENT:    "bg-sky-100 text-sky-700",
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function UserModal({
  user, onClose, onSaved,
}: {
  user: AppUserResponse | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!user
  const [name,      setName]      = useState(user?.name      ?? "")
  const [email,     setEmail]     = useState(user?.email     ?? "")
  const [phone,     setPhone]     = useState(user?.phone     ?? "")
  const [studentId, setStudentId] = useState(user?.studentId ?? "")
  const [generation,setGen]       = useState(user?.generation?.toString() ?? "")
  const [role,      setRole]      = useState<Role>(user?.role ?? "STUDENT")
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")

  async function handleSubmit() {
    setSaving(true); setError("")

    const result = isEdit
      ? await updateUserAction(user!.id, {
          name,
          phone: phone || undefined,
          studentId: studentId || undefined,
          generation: generation ? Number(generation) : undefined,
        })
      : await createUserAction({
          name,
          email,
          phone: phone || undefined,
          studentId: studentId || undefined,
          generation: generation ? Number(generation) : undefined,
          role,
        })

    setSaving(false)
    if (!result.ok) { setError(result.error); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">{isEdit ? "Edit User" : "Create User"}</h2>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid gap-3">
          <input className="input" placeholder="Full name *" value={name} onChange={e => setName(e.target.value)} />
          {!isEdit && (
            <>
              <input className="input" placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <select className="input" value={role} onChange={e => setRole(e.target.value as Role)}>
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </>
          )}
          <input className="input" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
          <input className="input" placeholder="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} />
          <input className="input" placeholder="Generation (year)" type="number" value={generation} onChange={e => setGen(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? <LoaderIcon className="size-4 animate-spin" /> : isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <p className="text-sm">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Confirm</button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function UserManager({
  initialUsers, currentUserId,
}: {
  initialUsers: AppUserResponse[]
  currentUserId: string
}) {
  const [users,   setUsers]   = useState(initialUsers)
  const [search,  setSearch]  = useState("")
  const [modal,   setModal]   = useState<"create" | AppUserResponse | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; action: () => Promise<{ ok: boolean; error?: string }> } | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getUsersAction()
      if (result.ok) setUsers(result.data)
    })
  }

  function runConfirm(message: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setConfirm({ message, action })
  }

  async function executeConfirm() {
    if (!confirm) return
    const result = await confirm.action()
    if (result.ok) {
      toastSuccess("Done")
      refresh()
    } else {
      toastError(result.error ?? "Something went wrong")
    }
    setConfirm(null)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={() => setModal("create")} className="btn-primary flex items-center gap-2">
          <PlusIcon className="size-4" /> Create User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input className="input pl-9" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      {isRefreshing
        ? <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>
        : (
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  {["Name", "Email", "Role", "Student ID", "Status", "Flags", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {u.name}{u.id === currentUserId && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.studentId ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.active ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 text-xs">
                        {u.verified    && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Verified</span>}
                        {u.deviceBound && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Device</span>}
                        {u.firstLogin  && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">1st Login</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button title="Edit" onClick={() => setModal(u)} className="icon-btn">
                          <PencilIcon className="size-4" />
                        </button>
                        {/* Ban / Unban */}
                        <button title={u.active ? "Ban" : "Unban"}
                          onClick={() => runConfirm(`${u.active ? "Ban" : "Unban"} ${u.name}?`, () => setUserActiveAction(u.id, !u.active))}
                          className="icon-btn">
                          {u.active ? <ShieldOffIcon className="size-4 text-amber-600" /> : <ShieldCheckIcon className="size-4 text-green-600" />}
                        </button>
                        {/* Reset password */}
                        <button title="Reset Password"
                          onClick={() => runConfirm(`Send temp password to ${u.email}?`, () => resetUserPasswordAction(u.id))}
                          className="icon-btn">
                          <KeyRoundIcon className="size-4 text-sky-600" />
                        </button>
                        {/* Reset device */}
                        <button title="Reset Device"
                          onClick={() => runConfirm(`Reset device binding for ${u.name}?`, () => resetUserDeviceAction(u.id))}
                          className="icon-btn">
                          <SmartphoneIcon className="size-4 text-violet-600" />
                        </button>
                        {/* Reset face */}
                        <button title="Reset Face"
                          onClick={() => runConfirm(`Reset face data for ${u.name}?`, async () => {
                            try { await faceApi.adminReset(u.id); return { ok: true } }
                            catch (e) { return { ok: false, error: (e as Error).message } }
                          })}
                          className="icon-btn">
                          <ScanFaceIcon className="size-4 text-pink-600" />
                        </button>
                        {/* Delete */}
                        <button title="Delete"
                          onClick={() => runConfirm(`Permanently delete ${u.name}? This cannot be undone.`, () => deleteUserAction(u.id))}
                          className="icon-btn">
                          <TrashIcon className="size-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No users found.</p>
            )}
          </div>
        )}

      {/* Modals */}
      {modal && (
        <UserModal
          user={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refresh(); toastSuccess(modal === "create" ? "User created" : "User updated") }}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={executeConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}