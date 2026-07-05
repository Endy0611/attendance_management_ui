"use client"

import { useEffect, useMemo, useState } from "react"
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
  CheckCircleIcon, XCircleIcon, ClockIcon, ActivityIcon,
  ArrowUpRightIcon, ArrowDownRightIcon, MinusIcon, SparklesIcon,
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

// each role gets a consistent identity color used for its header, focus rings, and eyebrow labels
const ROLE_ACCENT: Record<string, string> = {
  ADMIN: ACCENT.navy,
  INSTRUCTOR: ACCENT.violet,
  STUDENT: ACCENT.emerald,
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return "Still up"
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// ── Data helpers ───────────────────────────────────────────────────────────────
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

// week-over-week trend from a daily bucket series (first half vs second half)
function trendFromBuckets(buckets: { value: number }[]) {
  const mid = Math.floor(buckets.length / 2) || 1
  const prev = buckets.slice(0, mid).reduce((a, b) => a + b.value, 0)
  const curr = buckets.slice(mid).reduce((a, b) => a + b.value, 0)
  if (prev === 0 && curr === 0) return 0
  if (prev === 0) return 100
  return Math.round(((curr - prev) / prev) * 100)
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

// ── Small building blocks ───────────────────────────────────────────────────────
function LiveDot({ color = "#16A34A" }: { color?: string }) {
  return (
    <span className="relative flex size-2">
      <span className="motion-safe:absolute motion-safe:inline-flex h-full w-full motion-safe:animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

// small uppercase wayfinding label — color-codes each section so the eye can
// scan the dashboard by category (analytics / live / team / progress) before reading words
function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-[0.14em] uppercase mb-1"
      style={{ color }}
    >
      {children}
    </p>
  )
}

function EmptyState({ icon, message, accent }: { icon: React.ReactNode; message: string; accent: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 gap-2.5">
      <div className="p-2.5 rounded-full" style={{ backgroundColor: `${accent}12`, color: accent }}>
        {icon}
      </div>
      <p className="text-sm text-muted-foreground max-w-[220px]">{message}</p>
    </div>
  )
}

function TrendBadge({ value }: { value: number }) {
  const up = value > 0
  const flat = value === 0
  const color = flat ? "#6B7280" : up ? ACCENT.emerald : ACCENT.rose
  const Icon = flat ? MinusIcon : up ? ArrowUpRightIcon : ArrowDownRightIcon
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium font-[family-name:var(--font-mono)]"
      style={{ backgroundColor: `${color}17`, color }}
    >
      <Icon className="size-3" />
      {flat ? "0%" : `${Math.abs(value)}%`}
    </span>
  )
}

function DashboardHeader({ title, subtitle, accent = ACCENT.navy, icon }: {
  title: string; subtitle: string; accent?: string; icon?: React.ReactNode
}) {
  const now = useClock()
  return (
    <div className="pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center size-8 rounded-xl shrink-0"
              style={{ background: `linear-gradient(135deg, ${accent}26, ${accent}0D)`, color: accent }}
            >
              {icon ?? <SparklesIcon className="size-4" />}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[42px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border rounded-full px-3 py-1.5 font-[family-name:var(--font-mono)] shadow-sm">
          <LiveDot />
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
      {/* signature: thin identity-colored gradient rule, ties every section below back to this role */}
      <div className="h-px w-full mt-4 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}55, ${accent}00 65%)` }} />
    </div>
  )
}

function StatCard({ label, value, icon, accent, caption, trend, spark }: {
  label: string; value: number | string
  icon: React.ReactNode; accent: string; caption?: string; trend?: number; spark?: number[]
}) {
  const sparkData = spark ?? seededWave(label)
  return (
    <div className="group rounded-2xl border bg-card p-5 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl w-fit transition-transform group-hover:scale-105" style={{ backgroundColor: `${accent}1A`, color: accent }}>
          {icon}
        </div>
        <Sparkline data={sparkData} color={accent} />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)] tabular-nums">{value}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
      </div>
      {caption && <p className="text-[11px] text-muted-foreground/80 -mt-1">{caption}</p>}
    </div>
  )
}

// Catmull-Rom → cubic bezier, for a smooth organic curve instead of straight segments
function smoothPath(points: readonly (readonly [number, number])[]) {
  if (points.length < 2) return ""
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`
  }
  return d
}

function MiniAreaChart({ data, color, valueLabel, valuePrefix = "" }: {
  data: { label: string; value: number }[]; color: string; valueLabel?: string; valuePrefix?: string
}) {
  const w = 600, h = 200, pad = 24
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map(d => d.value))
  const min = Math.min(0, ...data.map(d => d.value))
  const stepX = (w - pad * 2) / (data.length - 1 || 1)
  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = h - pad - ((d.value - min) / (max - min || 1)) * (h - pad * 2 - 14)
    return [x, y] as const
  })
  const linePath = smoothPath(points)
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - pad} L${points[0][0]},${h - pad} Z`
  const gradientId = `grad-${color.replace("#", "")}`
  const gridLines = 4

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * w
    let closest = 0
    let closestDist = Infinity
    points.forEach(([x], i) => {
      const dist = Math.abs(x - relX)
      if (dist < closestDist) { closestDist = dist; closest = i }
    })
    setHover(closest)
  }

  const active = hover !== null ? hover : points.length - 1
  const [ax, ay] = points[active]
  const tooltipLeft = ax > w - 140
  const tooltipX = tooltipLeft ? ax - 130 : ax + 12

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-48 overflow-visible cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(gridLines)].map((_, i) => {
        const y = pad + (i * (h - pad * 2 - 14)) / (gridLines - 1)
        return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="currentColor" className="text-muted-foreground/15" strokeWidth="1" />
      })}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* hover guide line */}
      <line x1={ax} x2={ax} y1={pad - 6} y2={h - pad} stroke={color} strokeWidth="1" strokeDasharray="3 4" opacity={hover !== null ? 0.5 : 0} />

      {points.map(([x, y], i) => (
        <g key={i} opacity={hover === null || hover === i ? 1 : 0.35} style={{ transition: "opacity 0.15s" }}>
          {i === active && <circle cx={x} cy={y} r="9" fill={color} opacity="0.15" />}
          <circle cx={x} cy={y} r={i === active ? 4.5 : 3} fill="white" stroke={color} strokeWidth="2" />
        </g>
      ))}

      {data.map((d, i) => (
        <text key={i} x={pad + i * stepX} y={h - 2} textAnchor="middle" fontSize="10.5" className="fill-muted-foreground font-[family-name:var(--font-mono)]">
          {d.label}
        </text>
      ))}

      {/* tooltip bubble */}
      <foreignObject x={tooltipX} y={Math.max(0, ay - 46)} width="128" height="46">
        <div
          className="rounded-lg px-2.5 py-1.5 text-white shadow-lg font-[family-name:var(--font-mono)]"
          style={{ backgroundColor: color }}
        >
          <p className="text-sm font-semibold leading-tight">{valuePrefix}{data[active].value.toLocaleString()}</p>
          <p className="text-[10px] opacity-80 leading-tight">{valueLabel ?? data[active].label}</p>
        </div>
      </foreignObject>
    </svg>
  )
}

// Tiny decorative sparkline for stat cards
function Sparkline({ data, color, width = 72, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  const pad = 3
  const max = Math.max(...data)
  const min = Math.min(...data)
  const stepX = (width - pad * 2) / (data.length - 1 || 1)
  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2)
    return [x, y] as const
  })
  const linePath = smoothPath(points)
  const gid = `spark-${color.replace("#", "")}-${width}`
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={color} />
    </svg>
  )
}

// deterministic decorative wave for cards without a natural time-series (seeded by label)
function seededWave(seed: string, n = 8) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const vals: number[] = []
  let v = 40 + (h % 30)
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    v += ((h % 21) - 10)
    v = Math.max(15, Math.min(85, v))
    vals.push(v)
  }
  return vals
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
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// Donut / circular gauge — inspired by the "Monthly Goals" ring
function CircularGauge({ value, color, size = 128, label, sublabel }: {
  value: number; color: string; size?: number; label?: string; sublabel?: string
}) {
  const stroke = size * 0.11
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold font-[family-name:var(--font-display)] tabular-nums">{pct}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium mt-3">{label}</p>}
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

// Activity heatmap grid — inspired by the "Top Products" weekly grid
function ActivityHeatmap({ rows, days, color }: {
  rows: { label: string; counts: number[] }[]; days: string[]; color: string
}) {
  const max = Math.max(1, ...rows.flatMap(r => r.counts))
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `minmax(72px,auto) repeat(${days.length}, minmax(28px,1fr))` }}>
        <div />
        {days.map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-[family-name:var(--font-mono)]">{d}</div>
        ))}
        {rows.map(row => (
          <div key={row.label} className="contents">
            <div className="text-xs font-medium truncate pr-2 flex items-center">{row.label}</div>
            {row.counts.map((v, i) => {
              const intensity = v === 0 ? 0.06 : 0.18 + (v / max) * 0.82
              return (
                <div
                  key={i}
                  title={`${row.label} · ${days[i]}: ${v}`}
                  className="aspect-square rounded-md"
                  style={{ backgroundColor: color, opacity: intensity }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  const shimmer = "motion-safe:animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted"
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={`h-7 w-56 rounded-md ${shimmer}`} />
          <div className={`h-4 w-72 rounded-md ${shimmer}`} />
        </div>
        <div className={`h-8 w-24 rounded-full ${shimmer}`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-32 rounded-2xl ${shimmer}`} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`lg:col-span-2 h-56 rounded-2xl ${shimmer}`} />
        <div className={`h-56 rounded-2xl ${shimmer}`} />
      </div>
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

  const chartData = useMemo(() => dailyCounts(sessions), [sessions])
  const sessionTrend = useMemo(() => trendFromBuckets(chartData), [chartData])

  const heatmapRows = useMemo(() => {
    const days = chartData.map(d => d.label)
    return groups.slice(0, 5).map(g => {
      const counts = chartData.map((_, i) => {
        const now = new Date()
        const target = new Date(now); target.setDate(now.getDate() - (chartData.length - 1 - i))
        return sessions.filter(s => s.groupName === g.name && new Date(s.startTime).toDateString() === target.toDateString()).length
      })
      return { label: g.name, counts }
    })
  }, [groups, sessions, chartData])

  if (loading) return <Skeleton />

  const students    = users.filter(u => u.role === "STUDENT").length
  const instructors = users.filter(u => u.role === "INSTRUCTOR").length
  const admins      = users.filter(u => u.role === "ADMIN").length
  const active      = sessions.filter(s => s.active)
  const goalPct     = Math.min(100, Math.round((sessions.length / Math.max(1, groups.length * 4)) * 100))

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle={`${greeting()} — here's the real-time view across every group, course, and check-in.`}
        accent={ROLE_ACCENT.ADMIN}
        icon={<LayersIcon className="size-4" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Students"    value={students}        icon={<UsersIcon className="size-5" />}    accent={ACCENT.sky} />
        <StatCard label="Instructors" value={instructors}     icon={<UsersIcon className="size-5" />}    accent={ACCENT.amber} />
        <StatCard label="Courses"     value={courses.length}  icon={<BookOpenIcon className="size-5" />} accent={ACCENT.violet} />
        <StatCard label="Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.emerald} />
        <StatCard label="Sessions"    value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.navy} trend={sessionTrend} spark={chartData.map(d => d.value)} />
        <StatCard label="Active Now"  value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel color={ACCENT.navy}>Analytics</SectionLabel>
              <h2 className="font-semibold font-[family-name:var(--font-display)]">Session Activity</h2>
              <p className="text-xs text-muted-foreground">Sessions started, last 7 days</p>
            </div>
            <TrendBadge value={sessionTrend} />
          </div>
          <MiniAreaChart data={chartData} color={ACCENT.navy} valueLabel="Since last week" />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center">
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.gold}>Target</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Weekly Goal</h2>
          </div>
          <CircularGauge value={goalPct} color={ACCENT.gold} label="Sessions Coverage" sublabel="vs. expected pace" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel color={ACCENT.navy}>Engagement</SectionLabel>
              <h2 className="font-semibold font-[family-name:var(--font-display)]">Group Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground">Check-ins per day</span>
          </div>
          {heatmapRows.length === 0 ? (
            <EmptyState icon={<LayersIcon className="size-4" />} message="No group activity yet — it'll show up here once sessions start." accent={ACCENT.navy} />
          ) : (
            <ActivityHeatmap rows={heatmapRows} days={chartData.map(d => d.label)} color={ACCENT.navy} />
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <SectionLabel color={ACCENT.rose}>Live feed</SectionLabel>
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Live Sessions</h2>
          {active.length === 0 ? (
            <EmptyState icon={<ActivityIcon className="size-4" />} message="Nothing is checking in right now." accent={ACCENT.rose} />
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {active.map(s => (
                <div key={s.id} className="border rounded-xl p-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{s.groupName} — {s.courseCode}</p>
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
        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <SectionLabel color={ACCENT.navy}>People</SectionLabel>
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

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <SectionLabel color={ACCENT.rose}>Breakdown</SectionLabel>
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
    Promise.all([groupApi.myGroups(), sessionApi.forCurrentUser()])
      .then(([g, s]) => {
        setGroups(g ?? [])
        setSessions(s ?? [])
      })
      .catch((err) => {
        console.error("Failed to load instructor dashboard data:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  const chartData    = useMemo(() => dailyCounts(sessions), [sessions])
  const sessionTrend = useMemo(() => trendFromBuckets(chartData), [chartData])

  if (loading) return <Skeleton />

  const active     = sessions.filter(s => s.active)
  const maxMembers = Math.max(1, ...groups.map(g => g.memberCount))
  const avgFill    = groups.length > 0
    ? Math.round(groups.reduce((a, g) => a + g.memberCount / maxMembers, 0) / groups.length * 100)
    : 0

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Instructor Dashboard"
        subtitle={`${greeting()} — here's how your groups and check-ins are trending.`}
        accent={ROLE_ACCENT.INSTRUCTOR}
        icon={<BookOpenIcon className="size-4" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.violet} />
        <StatCard label="Total Sessions" value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.sky} trend={sessionTrend} spark={chartData.map(d => d.value)} />
        <StatCard label="Active Now"     value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel color={ACCENT.sky}>Analytics</SectionLabel>
              <h2 className="font-semibold font-[family-name:var(--font-display)]">Session Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <MiniAreaChart data={chartData} color={ACCENT.navy} valueLabel="Since last week" />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center">
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.violet}>Capacity</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Group Fill Rate</h2>
          </div>
          <CircularGauge value={avgFill} color={ACCENT.violet} label="Avg. capacity used" sublabel={`${groups.length} group${groups.length === 1 ? "" : "s"}`} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionLabel color={ACCENT.violet}>Team</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">My Groups</h2>
          </div>
          {active.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${ACCENT.rose}17`, color: ACCENT.rose }}>
              <LiveDot color={ACCENT.rose} /> {active.length} live
            </span>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(g => (
            <div key={g.id} className="border rounded-xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-muted-foreground text-xs">{g.courseCode}</p>
                </div>
                <span className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">{g.memberCount}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(g.memberCount / maxMembers) * 100}%`, backgroundColor: ACCENT.violet }} />
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
      <DashboardHeader
        title={`Welcome, ${user?.name ?? "Student"}`}
        subtitle={`${greeting()} — here's how your attendance looks.`}
        accent={ROLE_ACCENT.STUDENT}
        icon={<CheckCircleIcon className="size-4" />}
      />

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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center">
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.emerald}>Progress</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Attendance Rate</h2>
          </div>
          <CircularGauge value={rate} color={ACCENT.emerald} sublabel={`${total} recorded session${total === 1 ? "" : "s"}`} />
        </div>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          <StatCard label="Present" value={present} icon={<CheckCircleIcon className="size-5" />} accent={ACCENT.emerald} />
          <StatCard label="Late"    value={late}    icon={<ClockIcon className="size-5" />}       accent={ACCENT.amber} />
          <StatCard label="Absent"  value={absent}  icon={<XCircleIcon className="size-5" />}     accent={ACCENT.rose} />
          <div className="sm:col-span-3 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
            <div className="flex justify-between items-baseline mb-2">
              <div>
                <SectionLabel color={ACCENT.rose}>Breakdown</SectionLabel>
                <span className="font-medium text-sm">Status Breakdown</span>
              </div>
              <span className="text-muted-foreground font-[family-name:var(--font-mono)] text-xs">{total} total</span>
            </div>
            <div className="space-y-3">
              <DistributionBar label="Present" value={present} total={total} color={ACCENT.emerald} />
              <DistributionBar label="Late"    value={late}    total={total} color={ACCENT.amber} />
              <DistributionBar label="Absent"  value={absent}  total={total} color={ACCENT.rose} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionLabel color={ACCENT.rose}>Live feed</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Active Sessions Now</h2>
          </div>
          {sessions.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${ACCENT.rose}17`, color: ACCENT.rose }}>
              <LiveDot color={ACCENT.rose} /> {sessions.length} open
            </span>
          )}
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={<CalendarIcon className="size-4" />} message="No active sessions in your groups right now — check back when class starts." accent={ACCENT.rose} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sessions.map(s => (
              <div key={s.id} className="border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm truncate">{s.groupName} — {s.courseCode}</p>
                  <LiveDot />
                </div>
                <p className="text-muted-foreground text-xs font-[family-name:var(--font-mono)]">
                  {s.zoneName} · {s.radiusMeters}m radius
                </p>
                <p className="text-muted-foreground text-xs font-[family-name:var(--font-mono)]">
                  Until {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <a href={`/dashboard/attendance/check-in?sessionId=${s.id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: ACCENT.navy, ["--tw-ring-color" as string]: ACCENT.navy }}>
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

        <main className="flex flex-1 flex-col gap-4 p-6 bg-gradient-to-b from-muted/30 to-transparent">
          {loading && <Skeleton />}
          {!loading && user?.role === "ADMIN"      && <AdminDashboard />}
          {!loading && user?.role === "INSTRUCTOR" && <InstructorDashboard />}
          {!loading && user?.role === "STUDENT"    && <StudentDashboard />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}