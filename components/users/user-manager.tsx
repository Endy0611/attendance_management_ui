"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  getUsersAction, createUserAction, updateUserAction, deleteUserAction,
  setUserActiveAction, resetUserPasswordAction, resetUserDeviceAction,
} from "@/actions/admin.action"
import { faceApi } from "@/lib/api"
import { toastSuccess, toastError } from "@/lib/toast"
import type { AppUserResponse } from "@/types/auth-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownPortal, useDropdownPosition } from "@/components/ui/dropdown-portal"
import {
  PlusIcon, PencilIcon, TrashIcon, ShieldOffIcon, ShieldCheckIcon,
  KeyRoundIcon, SmartphoneIcon, ScanFaceIcon, SearchIcon, LoaderIcon,
  MoreVerticalIcon, UsersIcon, AlertTriangleIcon, XIcon, UserCheckIcon,
  UserXIcon, CrownIcon, GraduationCapIcon, UserIcon,
} from "lucide-react"

const NAVY = "#1C4D8D"

// These used to lean on global .input / .btn-ghost / .btn-danger / .icon-btn
// classes that weren't actually defined anywhere reachable — which is why
// Cancel/Confirm had no color. Spelling them out here as real Tailwind
// classes so every input and button is guaranteed to render styled.
const INPUT_CLS = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-[#1C4D8D] focus:ring-2 focus:ring-[#1C4D8D]/15"
const BTN_GHOST = "px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground bg-background hover:bg-muted transition-colors"
const BTN_DANGER = "px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
const ICON_BTN = "flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"

type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT"

// Each role gets a full color identity (badge, avatar gradient, and a
// ring/icon tone), used consistently everywhere the role shows up — the
// table, the mobile cards, and the filter chips — so a role reads the same
// color no matter where you spot it.
const ROLE_STYLES: Record<Role, { badge: string; avatar: string; ring: string; icon: React.ComponentType<{ className?: string }> }> = {
  ADMIN: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    avatar: "bg-gradient-to-br from-rose-400 to-rose-600",
    ring: "ring-rose-200 dark:ring-rose-900",
    icon: CrownIcon,
  },
  INSTRUCTOR: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    avatar: "bg-gradient-to-br from-amber-400 to-amber-600",
    ring: "ring-amber-200 dark:ring-amber-900",
    icon: GraduationCapIcon,
  },
  STUDENT: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    avatar: "bg-gradient-to-br from-sky-400 to-sky-600",
    ring: "ring-sky-200 dark:ring-sky-900",
    icon: UserIcon,
  },
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("")
}

function getDisplayAvatar(avatarValue?: string): string | undefined {
  if (!avatarValue || avatarValue.trim() === "") return undefined
  if (avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) return avatarValue
  return `${process.env.NEXT_PUBLIC_API_URL}/files/preview-file?key=${avatarValue}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="h-1.5" style={{ backgroundColor: NAVY }} />
        <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: NAVY }}>
              <UsersIcon className="size-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{isEdit ? "Edit user" : "Create user"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? "Update account details" : "Add a new account to the system"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`${ICON_BTN} -mr-1.5 -mt-1.5`}>
            <XIcon className="size-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="grid gap-3.5">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Full name *</span>
            <input className={INPUT_CLS} placeholder="e.g. Sokha Chan" value={name} onChange={e => setName(e.target.value)} />
          </label>

          {!isEdit && (
            <>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Email *</span>
                <input className={INPUT_CLS} placeholder="name@university.edu" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["STUDENT", "INSTRUCTOR", "ADMIN"] as Role[]).map(r => {
                    const RIcon = ROLE_STYLES[r].icon
                    const active = role === r
                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                          active ? ROLE_STYLES[r].badge + " border-transparent ring-2 " + ROLE_STYLES[r].ring : "border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <RIcon className="size-4" />
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    )
                  })}
                </div>
              </label>
            </>
          )}

          <div className="grid grid-cols-2 gap-3.5">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Phone</span>
              <input className={INPUT_CLS} placeholder="Optional" value={phone} onChange={e => setPhone(e.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Student ID</span>
              <input className={INPUT_CLS} placeholder="Optional" value={studentId} onChange={e => setStudentId(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Generation (year)</span>
            <input className={INPUT_CLS} placeholder="Optional" type="number" value={generation} onChange={e => setGen(e.target.value)} />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="min-w-28 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: NAVY }}
          >
            {saving ? <LoaderIcon className="size-4 animate-spin" /> : isEdit ? "Save changes" : "Create user"}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, danger, onConfirm, onCancel }: {
  message: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 size-9 rounded-full flex items-center justify-center ${danger ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"}`}>
            <AlertTriangleIcon className="size-4.5" />
          </div>
          <p className="text-sm leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className={BTN_GHOST}>Cancel</button>
          <button
            onClick={onConfirm}
            className={danger ? BTN_DANGER : "rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"}
            style={danger ? undefined : { backgroundColor: NAVY }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Row Actions Dropdown ──────────────────────────────────────────────────────
function RowActions({
  user, onEdit, onToggleActive, onResetPassword, onResetDevice, onResetFace, onDelete,
}: {
  user: AppUserResponse
  onEdit: () => void
  onToggleActive: () => void
  onResetPassword: () => void
  onResetDevice: () => void
  onResetFace: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const position = useDropdownPosition(open, triggerRef, 208)

  const style = ROLE_STYLES[user.role as Role]

  const primaryItems = [
    { label: "Edit", icon: <PencilIcon className="size-4" />, onClick: onEdit },
    { label: user.active ? "Ban user" : "Unban user", icon: user.active ? <ShieldOffIcon className="size-4" /> : <ShieldCheckIcon className="size-4" />, onClick: onToggleActive },
  ]
  const secondaryItems = [
    { label: "Reset password", icon: <KeyRoundIcon className="size-4" />, onClick: onResetPassword },
    { label: "Reset device", icon: <SmartphoneIcon className="size-4" />, onClick: onResetDevice },
    { label: "Reset face data", icon: <ScanFaceIcon className="size-4" />, onClick: onResetFace },
  ]

  function itemClick(fn: () => void) {
    setOpen(false)
    fn()
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        aria-label={`Actions for ${user.name}`}
        aria-expanded={open}
        className={`${ICON_BTN} ${open ? "bg-muted text-foreground" : ""}`}
      >
        <MoreVerticalIcon className="size-4" />
      </button>

      <DropdownPortal open={open} onClose={() => setOpen(false)} position={position}>
        {/* User context header — so it's unambiguous whose menu this is,
            especially once it's floating free of the row via the portal. */}
        {/* User context header */}
<div className="flex items-center gap-2.5 px-3 pb-2 mb-1 border-b border-border">
  <Avatar className="size-7 shrink-0">
    <AvatarImage src={getDisplayAvatar(user.avatar)} alt={user.name} />
    <AvatarFallback className={`text-[11px] font-semibold text-white ${style.avatar}`}>
      {initials(user.name)}
    </AvatarFallback>
  </Avatar>
  <div className="min-w-0">
    <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
    <p className="text-xs text-muted-foreground truncate leading-tight">{user.email}</p>
  </div>
</div>

        <div className="py-0.5">
          {primaryItems.map(item => (
            <button
              key={item.label}
              onClick={() => itemClick(item.onClick)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-foreground hover:bg-muted/70 transition-colors"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="py-0.5 border-t border-border">
          {secondaryItems.map(item => (
            <button
              key={item.label}
              onClick={() => itemClick(item.onClick)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="py-0.5 border-t border-border">
          <button
            onClick={() => itemClick(onDelete)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
          >
            <TrashIcon className="size-4" />
            Delete
          </button>
        </div>
      </DropdownPortal>
    </>
  )
}

// ── User row content, shared between the desktop table and the mobile card ──
function UserBadges({ u }: { u: AppUserResponse }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {u.verified    && <span className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[11px] font-medium">Verified</span>}
      {u.deviceBound && <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 px-1.5 py-0.5 rounded-full text-[11px] font-medium">Device</span>}
      {u.firstLogin  && <span className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[11px] font-medium">1st login</span>}
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
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL")
  const [modal,   setModal]   = useState<"create" | AppUserResponse | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; danger?: boolean; action: () => Promise<{ ok: boolean; error?: string }> } | null>(null)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getUsersAction()
      if (result.ok) setUsers(result.data)
    })
  }

  function runConfirm(message: string, action: () => Promise<{ ok: boolean; error?: string }>, danger?: boolean) {
    setConfirm({ message, action, danger })
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

  const filtered = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    banned: users.filter(u => !u.active).length,
    admins: users.filter(u => u.role === "ADMIN").length,
  }

  const statCards = [
    { label: "Total users", value: stats.total, icon: UsersIcon, tone: "text-[#1C4D8D]", bg: "bg-[#1C4D8D]/10 dark:bg-[#1C4D8D]/20" },
    { label: "Active", value: stats.active, icon: UserCheckIcon, tone: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950" },
    { label: "Banned", value: stats.banned, icon: UserXIcon, tone: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-950" },
    { label: "Admins", value: stats.admins, icon: CrownIcon, tone: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-950" },
  ]

  function rowActionsFor(u: AppUserResponse) {
    return {
      user: u,
      onEdit: () => setModal(u),
      onToggleActive: () => runConfirm(`${u.active ? "Ban" : "Unban"} ${u.name}?`, () => setUserActiveAction(u.id, !u.active)),
      onResetPassword: () => runConfirm(`Send temp password to ${u.email}?`, () => resetUserPasswordAction(u.id)),
      onResetDevice: () => runConfirm(`Reset device binding for ${u.name}?`, () => resetUserDeviceAction(u.id)),
      onResetFace: () => runConfirm(`Reset face data for ${u.name}?`, async () => {
        try { await faceApi.adminReset(u.id); return { ok: true } }
        catch (e) { return { ok: false, error: (e as Error).message } }
      }),
      onDelete: () => runConfirm(`Permanently delete ${u.name}? This cannot be undone.`, () => deleteUserAction(u.id), true),
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage accounts, roles, and access</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: NAVY }}
        >
          <PlusIcon className="size-4" /> Create user
        </button>
      </div>

      {/* Stat chips — each with its own icon + tint instead of identical
          neutral boxes, so the numbers read at a glance without labels. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="rounded-xl border bg-card px-4 py-3.5 flex items-center gap-3">
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`size-4.5 ${s.tone}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">{s.label}</p>
              <p className="text-xl font-semibold tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            className={`${INPUT_CLS} pl-9`}
            style={{ borderColor: search ? NAVY : undefined }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = NAVY)}
            onBlur={e => (e.currentTarget.style.borderColor = search ? NAVY : "")}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", "ADMIN", "INSTRUCTOR", "STUDENT"] as const).map(r => {
            const active = roleFilter === r
            const RIcon = r === "ALL" ? UsersIcon : ROLE_STYLES[r].icon
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active ? "text-white border-transparent" : "bg-card text-muted-foreground hover:bg-muted/60 border-border"
                }`}
                style={active ? { backgroundColor: NAVY } : undefined}
              >
                <RIcon className="size-3.5" />
                {r === "ALL" ? "All roles" : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Data — table on sm+ screens, stacked cards on mobile so nothing
          gets squeezed into horizontal scroll on a phone. */}
      {isRefreshing ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map(u => {
              const style = ROLE_STYLES[u.role as Role]
              return (
                <div key={u.id} className={`rounded-2xl border bg-card p-4 space-y-3 ring-1 ${style.ring}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-11 shrink-0">
                        <AvatarImage src={getDisplayAvatar(u.avatar)} alt={u.name} />
                        <AvatarFallback className={`text-xs font-semibold text-white ${style.avatar}`}>
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">
                          {u.name}{u.id === currentUserId && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <RowActions {...rowActionsFor(u)} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>{u.role}</span>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                      <span className={`size-1.5 rounded-full ${u.active ? "bg-green-600" : "bg-red-600"}`} />
                      {u.active ? "Active" : "Banned"}
                    </span>
                    {u.studentId && <span className="text-xs text-muted-foreground">ID: {u.studentId}</span>}
                  </div>

                  <UserBadges u={u} />
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 text-center py-14 rounded-2xl border bg-card">
                <UsersIcon className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No users match your filters.</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    {["User", "Role", "Student ID", "Status", "Flags", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const style = ROLE_STYLES[u.role as Role]
                    return (
                      <tr key={u.id} className="border-t hover:bg-muted/25 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className={`size-9 shrink-0 ring-2 ${style.ring}`}>
                              <AvatarImage src={getDisplayAvatar(u.avatar)} alt={u.name} />
                              <AvatarFallback className={`text-xs font-semibold text-white ${style.avatar}`}>
                                {initials(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {u.name}{u.id === currentUserId && <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                            <style.icon className="size-3" /> {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{u.studentId ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"}`}>
                            <span className={`size-1.5 rounded-full ${u.active ? "bg-green-600" : "bg-red-600"}`} />
                            {u.active ? "Active" : "Banned"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <UserBadges u={u} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RowActions {...rowActionsFor(u)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 text-center py-14">
                <UsersIcon className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No users match your filters.</p>
              </div>
            )}
          </div>
        </>
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
          danger={confirm.danger}
          onConfirm={executeConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}