"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useAuthStore } from "@/store/auth.store"
import { adminApi, courseApi, groupApi, sessionApi, attendanceApi } from "@/lib/api"
import type { AppUser, Course, Group, Session, StudentAttendance } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

// Resolves a raw avatar value (storage key or full URL) to a displayable src.
function getDisplayAvatar(avatarValue?: string): string | undefined {
  if (!avatarValue || avatarValue.trim() === "") return undefined
  if (avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) return avatarValue
  return `${process.env.NEXT_PUBLIC_API_URL}/files/preview-file?key=${avatarValue}`
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

// Animates a number smoothly from its previous value to the next one whenever it changes,
// including the very first render (counts up from 0) — used to make stats feel alive.
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)
  useEffect(() => {
    const from = prevRef.current
    const to = target
    if (from === to) { setDisplay(to); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])
  return display
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
    <div className="relative pb-2 animate-fade-up overflow-hidden">
      {/* ambient glow: a soft blurred wash of the role's accent color behind the header */}
      <div
        className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full blur-3xl opacity-[0.16]"
        // style={{ background: accent }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="relative flex mt-1 ms-1 items-center justify-center size-8 rounded-xl shrink-0 transition-transform duration-300 hover:scale-110 hover:-rotate-6"
              style={{ background: `linear-gradient(135deg, ${accent}26, ${accent}0D)`, color: accent }}
            >
              <span
                className="absolute inset-0 rounded-xl motion-safe:animate-pulse"
                style={{ boxShadow: `0 0 0 1px ${accent}30` }}
                aria-hidden
              />
              {icon ?? <SparklesIcon className="size-4" />}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[42px]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/70 backdrop-blur-md border rounded-full px-3 py-1.5 font-[family-name:var(--font-mono)] shadow-sm transition-shadow hover:shadow-md">
          <LiveDot />
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>
      {/* signature: thin identity-colored gradient rule, ties every section below back to this role */}
      <div className="relative h-px w-full mt-4 rounded-full overflow-hidden">
        <div
          className="absolute inset-0 origin-left animate-scale-in"
          style={{ background: `linear-gradient(90deg, ${accent}55, ${accent}00 65%)`, animationDuration: "0.9s" }}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent, caption, trend, spark, delay = 0 }: {
  label: string; value: number | string
  icon: React.ReactNode; accent: string; caption?: string; trend?: number; spark?: number[]; delay?: number
}) {
  const sparkData = spark ?? seededWave(label)
  const numericTarget = typeof value === "number" ? value : 0
  const animatedValue = useCountUp(numericTarget)
  const displayValue = typeof value === "number" ? animatedValue : value
  return (
    <div
      className="group animate-fade-up rounded-2xl border bg-card p-5 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-xl w-fit transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ backgroundColor: `${accent}1A`, color: accent }}>
          {icon}
        </div>
        <Sparkline data={sparkData} color={accent} />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)] tabular-nums">{displayValue}</p>
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
  const w = 600, h = 190
  const padLeft = 30, padRight = 8, padTop = 18, padBottom = 24
  const [hover, setHover] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const linePathRef = useRef<SVGPathElement>(null)
  const max = Math.max(1, ...data.map(d => d.value))
  const min = Math.min(0, ...data.map(d => d.value))
  const stepX = (w - padLeft - padRight) / (data.length - 1 || 1)
  const points = data.map((d, i) => {
    const x = padLeft + i * stepX
    const y = h - padBottom - ((d.value - min) / (max - min || 1)) * (h - padTop - padBottom)
    return [x, y] as const
  })
  const linePath = smoothPath(points)
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h - padBottom} L${points[0][0]},${h - padBottom} Z`
  const gradientId = `grad-${color.replace("#", "")}`
  const glowId = `glow-${color.replace("#", "")}`

  // two quiet reference lines (mid + top) with their values labeled on the left,
  // instead of a dense boxed grid — gives scale without visual noise
  const ticks = [
    { y: h - padBottom, value: min },
    { y: h - padBottom - (h - padTop - padBottom) / 2, value: (min + max) / 2 },
    { y: padTop, value: max },
  ]

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
  const tooltipLeft = ax > w - 132
  const tooltipX = tooltipLeft ? ax - 122 : ax + 10

  useEffect(() => {
    setMounted(false)
    const el = linePathRef.current
    if (!el) return
    const length = el.getTotalLength()
    el.style.transition = "none"
    el.style.strokeDasharray = `${length}`
    el.style.strokeDashoffset = `${length}`
    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)"
      el.style.strokeDashoffset = "0"
      setMounted(true)
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linePath])

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-48 overflow-visible cursor-crosshair"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* quiet reference lines + value labels, fading in softly */}
      {ticks.map((t, i) => (
        <g key={i} className="animate-scale-in" style={{ transformOrigin: `${padLeft}px ${t.y}px`, animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}>
          <line x1={padLeft} x2={w - padRight} y1={t.y} y2={t.y} stroke="currentColor" className="text-muted-foreground/12" strokeWidth="1" strokeDasharray={i === 0 ? undefined : "3 5"} />
          <text x={padLeft - 8} y={t.y + 3} textAnchor="end" fontSize="10" className="fill-muted-foreground/60 font-[family-name:var(--font-mono)]">
            {Math.round(t.value)}
          </text>
        </g>
      ))}

      <path d={areaPath} fill={`url(#${gradientId})`} className="animate-scale-in" style={{ transformOrigin: "50% 100%", animationDuration: "0.8s" }} />

      {/* faint blurred glow duplicate riding behind the crisp line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" opacity={mounted ? 0.25 : 0} style={{ transition: "opacity 0.6s ease 0.4s" }} filter={`url(#${glowId})`} />
      <path ref={linePathRef} d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* hover guide line */}
      <line x1={ax} x2={ax} y1={padTop - 4} y2={h - padBottom} stroke={color} strokeWidth="1" strokeDasharray="3 4" opacity={hover !== null ? 0.45 : 0} style={{ transition: "opacity 0.15s" }} />

      {/* only the active point is marked — a live pulsing dot rather than a row of static circles */}
      <g
        className="animate-scale-in"
        style={{ transformOrigin: `${ax}px ${ay}px`, animationDelay: "900ms", animationFillMode: "backwards", transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <circle cx={ax} cy={ay} r="10" fill={color} opacity="0.12" className="motion-safe:animate-ping" style={{ transformOrigin: `${ax}px ${ay}px` }} />
        <circle cx={ax} cy={ay} r="4.5" fill="white" stroke={color} strokeWidth="2.5" />
      </g>

      {data.map((d, i) => (
        <text key={i} x={padLeft + i * stepX} y={h - 4} textAnchor="middle" fontSize="10.5" className="fill-muted-foreground/70 font-[family-name:var(--font-mono)]">
          {d.label}
        </text>
      ))}

      {/* tooltip bubble */}
      <foreignObject x={tooltipX} y={Math.max(0, ay - 44)} width="122" height="44">
        <div
          className="rounded-xl px-2.5 py-1.5 text-white shadow-lg font-[family-name:var(--font-mono)] backdrop-blur-sm"
          style={{ backgroundColor: `${color}E6` }}
        >
          <p className="text-sm font-semibold leading-tight">{valuePrefix}{data[active].value.toLocaleString()}</p>
          <p className="text-[10px] opacity-80 leading-tight">{valueLabel ?? data[active].label}</p>
        </div>
      </foreignObject>
    </svg>
  )
}

// Tiny decorative sparkline for stat cards — now draws itself in on mount, just like the big chart
function Sparkline({ data, color, width = 72, height = 30 }: { data: number[]; color: string; width?: number; height?: number }) {
  const pad = 3
  const lineRef = useRef<SVGPathElement>(null)
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

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    const length = el.getTotalLength()
    el.style.transition = "none"
    el.style.strokeDasharray = `${length}`
    el.style.strokeDashoffset = `${length}`
    const raf = requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)"
      el.style.strokeDashoffset = "0"
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linePath])

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gid})`} className="animate-scale-in" style={{ transformOrigin: "50% 100%", animationDuration: "0.7s" }} />
      <path ref={lineRef} d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.5" fill={color} className="animate-scale-in" style={{ transformOrigin: `${points[points.length - 1][0]}px ${points[points.length - 1][1]}px`, animationDelay: "0.8s", animationFillMode: "backwards" }} />
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-[family-name:var(--font-mono)]">{value} · {pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${mounted ? pct : 0}%`, backgroundColor: color }} />
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])
  const offset = c - ((mounted ? pct : 0) / 100) * c
  const animatedPct = useCountUp(pct, 900)

  return (
    <div className="flex flex-col items-center justify-center animate-scale-in">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold font-[family-name:var(--font-display)] tabular-nums">{animatedPct}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium mt-3">{label}</p>}
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  )
}

// Group activity card — replaces the old dense heatmap grid with a scannable
// per-group card: name, this-week total, trend, and a mini trajectory line.
function GroupActivityCard({ label, courseCode, counts, color, delay = 0 }: {
  label: string; courseCode?: string; counts: number[]; color: string; delay?: number
}) {
  const total = counts.reduce((a, b) => a + b, 0)
  const trend = trendFromBuckets(counts.map(v => ({ value: v })))
  const safeCounts = counts.some(v => v > 0) ? counts : counts.map(() => 0.0001)

  return (
    <div
      className="group rounded-xl border p-4 hover:bg-muted/30 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{label}</p>
          <p className="text-xs text-muted-foreground truncate">
            {courseCode ?? "—"} · {total} check-in{total === 1 ? "" : "s"} this week
          </p>
        </div>
        <TrendBadge value={trend} />
      </div>
      <Sparkline data={safeCounts} color={color} width={220} height={40} />
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
    return groups.slice(0, 6).map(g => {
      const counts = chartData.map((_, i) => {
        const now = new Date()
        const target = new Date(now); target.setDate(now.getDate() - (chartData.length - 1 - i))
        return sessions.filter(s => s.groupName === g.name && new Date(s.startTime).toDateString() === target.toDateString()).length
      })
      return { label: g.name, courseCode: g.courseCode, counts }
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
        <StatCard label="Students"    value={students}        icon={<UsersIcon className="size-5" />}    accent={ACCENT.sky} delay={0} />
        <StatCard label="Instructors" value={instructors}     icon={<UsersIcon className="size-5" />}    accent={ACCENT.amber} delay={60} />
        <StatCard label="Courses"     value={courses.length}  icon={<BookOpenIcon className="size-5" />} accent={ACCENT.violet} delay={120} />
        <StatCard label="Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.emerald} delay={180} />
        <StatCard label="Sessions"    value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.navy} trend={sessionTrend} spark={chartData.map(d => d.value)} delay={240} />
        <StatCard label="Active Now"  value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose} delay={300}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "360ms" }}>
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

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center animate-fade-up" style={{ animationDelay: "420ms" }}>
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.gold}>Target</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Weekly Goal</h2>
          </div>
          <CircularGauge value={goalPct} color={ACCENT.gold} label="Sessions Coverage" sublabel="vs. expected pace" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "480ms" }}>
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
            <div className="grid gap-3 sm:grid-cols-2">
              {heatmapRows.map((r, i) => (
                <GroupActivityCard key={r.label} label={r.label} courseCode={r.courseCode} counts={r.counts} color={ACCENT.navy} delay={i * 60} />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "540ms" }}>
          <SectionLabel color={ACCENT.rose}>Live feed</SectionLabel>
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Live Sessions</h2>
          {active.length === 0 ? (
            <EmptyState icon={<ActivityIcon className="size-4" />} message="Nothing is checking in right now." accent={ACCENT.rose} />
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {active.map((s, i) => (
                <div key={s.id} className="border rounded-xl p-3 hover:bg-muted/40 hover:-translate-x-0.5 transition-all duration-200 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
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
        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "600ms" }}>
          <SectionLabel color={ACCENT.navy}>People</SectionLabel>
          <h2 className="font-semibold mb-4 font-[family-name:var(--font-display)]">Recent Users</h2>
          <div className="space-y-3">
            {[...users]
  .sort((a, b) => new Date((b as any).createdAt ?? 0).getTime() - new Date((a as any).createdAt ?? 0).getTime())
  .slice(0, 6)
  .map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 animate-fade-up transition-transform duration-200 hover:translate-x-1" style={{ animationDelay: `${700 + i * 50}ms` }}>
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={getDisplayAvatar((u as unknown as { avatar?: string }).avatar)} alt={u.name ?? ""} />
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ backgroundColor: `${ACCENT.navy}1A`, color: ACCENT.navy }}
                  >
                    {u.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
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

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "660ms" }}>
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
        <StatCard label="My Groups"      value={groups.length}   icon={<LayersIcon className="size-5" />}   accent={ACCENT.violet} delay={0} />
        <StatCard label="Total Sessions" value={sessions.length} icon={<CalendarIcon className="size-5" />} accent={ACCENT.sky} trend={sessionTrend} spark={chartData.map(d => d.value)} delay={60} />
        <StatCard label="Active Now"     value={active.length}   icon={<ActivityIcon className="size-5" />} accent={ACCENT.rose} delay={120}
          caption={active.length > 0 ? `${active.length} check-in${active.length === 1 ? "" : "s"} live` : "Nothing running"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel color={ACCENT.sky}>Analytics</SectionLabel>
              <h2 className="font-semibold font-[family-name:var(--font-display)]">Session Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <MiniAreaChart data={chartData} color={ACCENT.navy} valueLabel="Since last week" />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center animate-fade-up" style={{ animationDelay: "300ms" }}>
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.violet}>Capacity</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Group Fill Rate</h2>
          </div>
          <CircularGauge value={avgFill} color={ACCENT.violet} label="Avg. capacity used" sublabel={`${groups.length} group${groups.length === 1 ? "" : "s"}`} />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "360ms" }}>
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
          {groups.map((g, i) => (
            <div key={g.id} className="border rounded-xl p-4 hover:bg-muted/30 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up" style={{ animationDelay: `${420 + i * 50}ms` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-muted-foreground text-xs">{g.courseCode}</p>
                </div>
                <span className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">{g.memberCount}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${(g.memberCount / maxMembers) * 100}%`, backgroundColor: ACCENT.violet }} />
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
        ].map((f, i) => (
          <span key={f.label} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium animate-fade-up transition-transform duration-200 hover:scale-105
            ${f.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`} style={{ animationDelay: `${i * 60}ms` }}>
            {f.ok ? <CheckCircleIcon className="size-3" /> : <XCircleIcon className="size-3" />}
            {f.label}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 flex flex-col items-center justify-center animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="self-start mb-2">
            <SectionLabel color={ACCENT.emerald}>Progress</SectionLabel>
            <h2 className="font-semibold font-[family-name:var(--font-display)]">Attendance Rate</h2>
          </div>
          <CircularGauge value={rate} color={ACCENT.emerald} sublabel={`${total} recorded session${total === 1 ? "" : "s"}`} />
        </div>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
          <StatCard label="Present" value={present} icon={<CheckCircleIcon className="size-5" />} accent={ACCENT.emerald} delay={240} />
          <StatCard label="Late"    value={late}    icon={<ClockIcon className="size-5" />}       accent={ACCENT.amber} delay={300} />
          <StatCard label="Absent"  value={absent}  icon={<XCircleIcon className="size-5" />}     accent={ACCENT.rose} delay={360} />
          <div className="sm:col-span-3 rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "420ms" }}>
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

      <div className="rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_36px_-14px_rgba(15,23,42,0.22)] transition-shadow duration-300 animate-fade-up" style={{ animationDelay: "480ms" }}>
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
            {sessions.map((s, i) => (
              <div key={s.id} className="border rounded-xl p-4 hover:bg-muted/30 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up" style={{ animationDelay: `${540 + i * 50}ms` }}>
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
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-up { animation: fadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-scale-in { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-up, .animate-scale-in {
            animation-duration: 0.001ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>
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
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
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