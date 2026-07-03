"use client"

import { useEffect, useState } from "react"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/auth.store"
import { adminApi, courseApi, groupApi, sessionApi, attendanceApi } from "@/lib/api"
import type { AppUser, Course, Group, Session, StudentAttendance } from "@/lib/api"
import {
  UsersIcon, BookOpenIcon, LayersIcon, CalendarIcon,
  CheckCircleIcon, XCircleIcon, ClockIcon, ActivityIcon, TrendingUpIcon,
} from "lucide-react"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] })

const ACCENT = {
  navy: "#1C4D8D",
  gold: "#F5A623",
  sky: "#0EA5E9",
  violet: "#7C3AED",
  emerald: "#10B981",
  rose: "#E11D48",
  amber: "#F59E0B",
}

function dailyCounts(sessions: Session[], days = 7) {
  const now = new Date()
  const buckets: { label: string; value: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    const count = sessions.filter(s => new Date(s.startTime).toDateString() === key).length
    buckets.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), value: count })
  }
  return buckets
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

function LiveDot({ color = "#16A34A" }: { color?: string }) {
  return (
    <span className="relative flex size-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const now = useClock()
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1.5 font-[family-name:var(--font-mono)]">
        <LiveDot />
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent, caption }: {
  label: string; value: number | string
  icon: React.ReactNode; accent: string; caption?: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col gap-3">
      <div className="p-2.5 rounded-xl w-fit" style={{ backgroundColor: `${accent}1A`, color: accent }}>{icon}</div>
      <div>
        <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)] tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
      {caption && <p className="text-[11px] text-muted-foreground/80 -mt-1">{caption}</p>}
    </div>
  )
}

function MiniAreaChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const w = 600, h = 160, pad = 24
  const max = Math.max(1, ...data.map(d => d.value))
  const stepX = (w - pad * 2) / (data.length - 1 || 1)
  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = h - pad - (d.value / max) * (h - pad * 2)
    return [x, y] as const
  })
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`
  const gradientId = `grad-${color.replace("#", "")}`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={color} />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pad + i * stepX} y={h - 4} textAnchor="middle" fontSize="10" className="fill-muted-foreground font-[family-name:var(--font-mono)]">
          {d.label}
        </text>
      ))}
    </svg>
  )
}

function DistributionBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-[family-name:var(--font-mono)]">{value} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-muted animate-pulse" />
    </div>
  )
}

// ── Admin ─────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [users, setUsers]       = useState<AppUser[]>([])
  const [courses, setCourses]   = useState<Course[]>([])
  const [groups, setGroups]     = useState<Group[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([adminApi.listUsers(), courseApi.list(), groupApi.list(), sessionApi.list()])
      .then(([u, c, g, s]) => {
        setUsers(u ?? [])
        setCourses(c ?? [])
        setGroups(g ?? [])
        setSessions(s ?? [])
      })
      .catch((err) => {
        console.error("Failed to load admin dashboard data:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const students    = users.filter(u => u.role === "STUDENT").length
  const instructors = users.filter(u => u.role === "INSTRUCTOR").length
  const admins      = users.filter(u => u.role === "ADMIN").length
  const active      = sessions.filter(s => s.active)
  const chartData   = dailyCounts(sessions)

  return (
    <div className="space-y-6">
      <DashboardHeader title="Admin Dashboard" subtitle="Real-time overview of every group, course, and check-in." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students"    value={students}        icon={<UsersIcon className="size-5" />}    accent={ACCENT.sky} />
        <StatCard label="Instructors" value={instructors}     icon={<UsersIcon className="size-5" />}    accent={ACCENT.amber} />
        <StatCard label="Courses"     value={courses.length}  icon={<BookOpenIcon className="size-5" />} accent={ACCENT.violet} />
        <StatCard label="Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.emerald} />
        <StatCard label="Sessions"    value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.navy} />
        <StatCard label="Active Now"  value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold font-[family-name:var(--font-display)]">Session Activity</h2>
              <p className="text-xs text-muted-foreground">Sessions started, last 7 days</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${ACCENT.navy}1A`, color: ACCENT.navy }}>
              <TrendingUpIcon className="size-3.5" />
              {sessions.length} total
            </span>
          </div>
          <MiniAreaChart data={chartData} color={ACCENT.navy} />
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Live Sessions</h2>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions right now.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {active.map(s => (
                <div key={s.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{s.groupName} — {s.courseCode}</p>
                    <LiveDot />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 font-[family-name:var(--font-mono)]">
                    {s.zoneName} · {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Recent Users</h2>
          <div className="space-y-3">
            {users.slice(0, 6).map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: `${ACCENT.navy}1A`, color: ACCENT.navy }}>
                  {u.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{u.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{u.email}</p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium
                  ${u.role === "ADMIN" ? "bg-rose-100 text-rose-700" :
                    u.role === "INSTRUCTOR" ? "bg-amber-100 text-amber-700" :
                    "bg-sky-100 text-sky-700"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Role Distribution</h2>
          <div className="space-y-4">
            <DistributionBar label="Students"    value={students}    total={users.length} color={ACCENT.sky} />
            <DistributionBar label="Instructors" value={instructors} total={users.length} color={ACCENT.amber} />
            <DistributionBar label="Admins"      value={admins}      total={users.length} color={ACCENT.rose} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Instructor ────────────────────────────────────────────────────────────────
function InstructorDashboard() {
  const [groups, setGroups]     = useState<Group[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([groupApi.myGroups(), sessionApi.myAll()])
      .then(([g, s]) => {
        setGroups(g ?? [])
        setSessions(s ?? [])
      })
      .catch((err) => {
        console.error("Failed to load instructor dashboard data:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const active     = sessions.filter(s => s.active)
  const chartData  = dailyCounts(sessions)
  const maxMembers = Math.max(1, ...groups.map(g => g.memberCount))

  return (
    <div className="space-y-6">
      <DashboardHeader title="Instructor Dashboard" subtitle="Track your groups and today's check-ins." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.violet} />
        <StatCard label="Total Sessions" value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.sky} />
        <StatCard label="Active Now"     value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Session Activity</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <MiniAreaChart data={chartData} color={ACCENT.navy} />
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Live Sessions</h2>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active sessions.</p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {active.map(s => (
                <div key={s.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{s.groupName}</p>
                    <LiveDot />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1 font-[family-name:var(--font-mono)]">
                    {s.zoneName} · {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–{new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">My Groups</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(g => (
            <div key={g.id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-muted-foreground text-xs">{g.courseCode}</p>
                </div>
                <span className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">{g.memberCount}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(g.memberCount / maxMembers) * 100}%`, backgroundColor: ACCENT.violet }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Student ───────────────────────────────────────────────────────────────────
function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const [sessions, setSessions] = useState<Session[]>([])
  const [records, setRecords]   = useState<StudentAttendance[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([sessionApi.myActive(), attendanceApi.mySessions()])
      .then(([s, r]) => {
        setSessions(s ?? [])
        setRecords(r ?? [])
      })
      .catch((err) => {
        console.error("Failed to load student dashboard data:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const present = records.filter(r => r.status === "PRESENT").length
  const late    = records.filter(r => r.status === "LATE").length
  const absent  = records.filter(r => r.status === "ABSENT").length
  const total   = records.length
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return (
    <div className="space-y-6">
      <DashboardHeader title={`Welcome, ${user?.name ?? "Student"}`} subtitle="Here's how your attendance looks." />

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Verified",     ok: user?.verified },
          { label: "Active",       ok: user?.active },
          { label: "Device Bound", ok: user?.deviceBound },
        ].map(f => (
          <span key={f.label} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium
            ${f.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {f.ok ? <CheckCircleIcon className="size-3" /> : <XCircleIcon className="size-3" />}
            {f.label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Present" value={present} icon={<CheckCircleIcon className="size-5" />} accent={ACCENT.emerald} />
        <StatCard label="Late"    value={late}    icon={<ClockIcon className="size-5" />}       accent={ACCENT.amber} />
        <StatCard label="Absent"  value={absent}  icon={<XCircleIcon className="size-5" />}     accent={ACCENT.rose} />
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold font-[family-name:var(--font-display)]">Attendance Rate</h2>
          <span className="text-2xl font-semibold tabular-nums font-[family-name:var(--font-display)]" style={{ color: ACCENT.emerald }}>
            {rate}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${rate}%`, backgroundColor: ACCENT.emerald }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Based on {total} recorded session{total === 1 ? "" : "s"}.</p>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Active Sessions Now</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions in your groups right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map(s => (
              <div key={s.id} className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{s.groupName} — {s.courseCode}</p>
                  <LiveDot />
                </div>
                <p className="text-muted-foreground text-xs font-[family-name:var(--font-mono)]">
                  {s.zoneName} · {s.radiusMeters}m radius
                </p>
                <p className="text-muted-foreground text-xs font-[family-name:var(--font-mono)]">
                  Until {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <a href={`/dashboard/attendance/check-in?sessionId=${s.id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: ACCENT.navy }}>
                  Check In →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const user = useAuthStore((s) => s.user)
  const loading = !useAuthStore((s) => s.hasHydrated)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 bg-muted/20">
          {loading && <Skeleton />}
          {!loading && user?.role === "ADMIN"      && <AdminDashboard />}
          {!loading && user?.role === "INSTRUCTOR" && <InstructorDashboard />}
          {!loading && user?.role === "STUDENT"    && <StudentDashboard />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}