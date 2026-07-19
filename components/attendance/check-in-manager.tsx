"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { checkInAction, requestCheckInHelpAction } from "@/actions/attendance.action"
import { bindDeviceAction } from "@/actions/device.action"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import type { GroupSessionResponse } from "@/types/session-types"
import type { DeviceResponse } from "@/types/device-types"
import type { AttendanceResponse } from "@/types/attendance-types"
import type { FaceStatusResponse } from "@/types/face-types"
import {
  MapPinIcon, CheckCircleIcon, XCircleIcon, LoaderIcon, NavigationIcon,
  SmartphoneIcon, ShieldCheckIcon, ScanFaceIcon, ClockIcon,
  RotateCcwIcon, AlertTriangleIcon, ArrowRightIcon, MegaphoneIcon, SparklesIcon,
} from "lucide-react"

const NAVY = "#1C4D8D"

// After this many consecutive face-verification failures on a single
// submission attempt, stop just saying "try again" and surface real
// fallback paths — most false negatives clear up in 1-2 retries; beyond
// that, retrying blindly just frustrates a student who IS the real owner.
const FACE_FAIL_FALLBACK_THRESHOLD = 2

// How long the "scanning" animation holds before auto-capturing the frame.
// Long enough to feel deliberate (like Face ID), short enough not to drag.
const SCAN_DURATION_MS = 1500

// Below this many minutes remaining, the "ends in" countdown switches to a
// more urgent visual treatment — mirrors the sense of urgency without
// requiring the student to do any math themselves.
const ENDING_SOON_MINUTES = 5

// ── helpers ──────────────────────────────────────────────────────────────

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "0:00"
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

// Backend's face-verification failure message is a stable string from
// AttendanceServiceImpl.checkIn() — matching on it (rather than assuming
// "any failure past device+location is a face failure") keeps this correct
// even if a geofence edge case slips through.
function isFaceVerificationError(message: string) {
  return message.toLowerCase().includes("face")
}

// Shared with MyAttendanceManager's STATUS_TOKEN palette — PRESENT/LATE
// stay emerald/amber everywhere, and this file adds ABSENT + a rose "ending
// soon" treatment on the same rose hue used for ABSENT in the table.
const STATUS_STYLE: Record<string, { text: string; bg: string; ring: string }> = {
  PRESENT: { text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", ring: "ring-emerald-500/20" },
  LATE: { text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", ring: "ring-amber-500/20" },
  ABSENT: { text: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950", ring: "ring-rose-500/20" },
}

const CARD = "rounded-3xl border bg-card/90 backdrop-blur-sm shadow-sm ring-1 ring-black/[0.03] transition-shadow duration-300 hover:shadow-md"

function StepBadge({ index, done, active }: { index: number; done: boolean; active: boolean }) {
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ease-out"
      style={
        done
          ? { backgroundColor: NAVY, color: "white", boxShadow: `0 0 0 4px ${NAVY}1A` }
          : active
            ? { backgroundColor: `${NAVY}1A`, color: NAVY, border: `1.5px solid ${NAVY}` }
            : undefined
      }
    >
      {done ? <CheckCircleIcon className="size-4 animate-in zoom-in-50 duration-300" /> : index}
    </div>
  )
}

// Overall progress — one slim bar reflecting how many of the two setup
// steps are done, so the student gets a sense of "almost there" without
// reading two separate step badges.
function ProgressRail({ deviceReady, locationReady, captureReady, faceRegistered }: {
  deviceReady: boolean; locationReady: boolean; captureReady: boolean; faceRegistered: boolean
}) {
  const total = faceRegistered ? 3 : 2
  const done = [deviceReady, locationReady, faceRegistered && captureReady].filter(Boolean).length
  const pct = Math.round((done / total) * 100)
  return (
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: NAVY }}
      />
    </div>
  )
}

// Face ID-style scan indicator — pulsing rings around a face icon while
// scanning, a checkmark once captured. The actual camera feed is never
// shown; only this abstraction is, which is calmer and reads as "trusted
// biometric prompt" rather than "here's a live photo of you".
type ScanPhase = "idle" | "starting" | "scanning" | "captured"

function FaceScanIndicator({ phase }: { phase: ScanPhase }) {
  if (phase === "captured") {
    return (
      <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-center size-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shadow-sm">
          <CheckCircleIcon className="size-8" />
        </div>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Face captured</p>
      </div>
    )
  }

  const active = phase === "scanning" || phase === "starting"
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center size-16">
        {active && (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping" style={{ backgroundColor: NAVY }} />
            <span
              className="absolute inline-flex h-12 w-12 rounded-full opacity-30 animate-ping"
              style={{ backgroundColor: NAVY, animationDelay: "300ms" }}
            />
          </>
        )}
        <div
          className="relative flex items-center justify-center size-14 rounded-full transition-all duration-500 ease-out"
          style={active ? { backgroundColor: NAVY, color: "white" } : { backgroundColor: `${NAVY}14`, color: NAVY }}
        >
          <ScanFaceIcon className="size-7" />
        </div>
      </div>
      <div className="text-center transition-opacity duration-300">
        <p className="text-sm font-medium">
          {phase === "starting" ? "Starting camera…" : phase === "scanning" ? "Scanning your face…" : "Ready to scan"}
        </p>
        <p className="text-xs text-muted-foreground">
          {active ? "Hold steady and look at the screen" : "Tap below when you're ready"}
        </p>
      </div>
    </div>
  )
}

// Shown in place of the whole check-in flow once alreadyCheckedIn is true
// for the selected session — prevents a pointless resubmit attempt that
// AttendanceServiceImpl.checkIn() would just reject anyway.
function AlreadyCheckedInCard() {
  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-6 text-center space-y-3 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600">
        <CheckCircleIcon className="size-6" />
      </div>
      <div>
        <p className="font-medium text-emerald-800 dark:text-emerald-300">You're already checked in</p>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
          No need to check in again for this session.
        </p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/attendance/me">View my attendance history</Link>
      </Button>
    </div>
  )
}

// ── main component ──────────────────────────────────────────────────────

interface CheckInManagerProps {
  initialSessions: GroupSessionResponse[]
  initialDevice: DeviceResponse | null
  initialFaceStatus: FaceStatusResponse | null
}

export function CheckInManager({ initialSessions, initialDevice, initialFaceStatus }: CheckInManagerProps) {
  const [now, setNow] = useState<number | null>(null)

  const [sessions] = useState(initialSessions)
  const [sessionId, setSessionId] = useState(initialSessions.length === 1 ? initialSessions[0].id : "")

  const [device, setDevice] = useState(initialDevice)
  const [binding, setBinding] = useState(false)
  const [deviceError, setDeviceError] = useState("")
  const fingerprint = useRef("")

  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState("")

  const [faceStatus] = useState(initialFaceStatus)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle")
  const [captured, setCaptured] = useState<string | null>(null)
  const [camError, setCamError] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [result, setResult] = useState<AttendanceResponse | null>(null)

  // ── Face-failure fallback state ─────────────────────────────
  const [faceFailCount, setFaceFailCount] = useState(0)
  const [helpRequesting, setHelpRequesting] = useState(false)
  const [helpSent, setHelpSent] = useState(false)
  const [helpError, setHelpError] = useState("")

  const selected = sessions.find((s) => s.id === sessionId) ?? null

  // tick every second for the countdown
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // device fingerprint + geolocation are client-only
  useEffect(() => {
    fingerprint.current = generateDeviceFingerprint()
    getLocation()
    return () => {
      stopCamera()
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switching sessions resets the fallback state — it's tied to attempts
  // against a specific session's help-request target, not a global count.
  useEffect(() => {
    setFaceFailCount(0)
    setHelpSent(false)
    setHelpError("")
  }, [sessionId])

  function getLocation() {
    setLocError("")
    setLocating(true)
    if (!navigator.geolocation) {
      setLocError("Geolocation isn't supported by this browser.")
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setLocating(false)
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enable it in your browser settings and try again."
            : `Couldn't get your location: ${err.message}`
        )
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function bindDevice() {
    setBinding(true)
    setDeviceError("")
    const result = await bindDeviceAction({ fingerprint: fingerprint.current, deviceInfo: navigator.userAgent })
    setBinding(false)
    if (!result.ok) {
      setDeviceError(result.error)
      toastError(result.error)
      return
    }
    setDevice(result.data)
    toastSuccess("Device bound")
  }

  // Camera is requested and kept running, but the <video> element itself is
  // never shown — only the FaceScanIndicator animation is. After a short
  // "scanning" beat (to feel deliberate, like Face ID) the frame is grabbed
  // automatically, so there's no separate manual "capture" tap.
  async function startFaceScan() {
    setCamError("")
    setScanPhase("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanPhase("scanning")
      scanTimerRef.current = setTimeout(() => {
        capture()
        setScanPhase("captured")
      }, SCAN_DURATION_MS)
    } catch {
      setCamError("Camera access was denied. Enable it in your browser settings and try again.")
      setScanPhase("idle")
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")!
    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    setCaptured(canvasRef.current.toDataURL("image/jpeg", 0.92))
    stopCamera()
  }

  function retakeScan() {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
    setCaptured(null)
    setScanPhase("idle")
    startFaceScan()
  }

  const deviceReady = !!device
  const locationReady = !!location
  const faceRegistered = !!faceStatus?.faceRegistered
  const captureReady = !!captured
  const alreadyCheckedIn = !!selected?.alreadyCheckedIn
  const canSubmit =
    !!selected && deviceReady && locationReady && faceRegistered && captureReady && !submitting && !alreadyCheckedIn
  const showFaceFallback = faceFailCount >= FACE_FAIL_FALLBACK_THRESHOLD

  // What's still needed before Check In becomes available — shown as a
  // plain-language summary instead of leaving the button silently disabled.
  const missingRequirements = [
    !deviceReady && "bind your device",
    !locationReady && "capture your location",
    faceRegistered && !captureReady && "scan your face",
  ].filter(Boolean) as string[]

  // ── Session timing state ────────────────────────────────────
  // Backend (GroupSession.isActive) already opens check-in 30 min before
  // startTime, so any session in `sessions` is checkinable the moment it
  // shows up here — this block only drives *display*: whether we're still
  // in the early window (before official start) or already past it.
  const startMs = selected ? new Date(selected.startTime).getTime() : null
  const endMs = selected ? new Date(selected.endTime).getTime() : null
  const hasStarted = now !== null && startMs !== null && now >= startMs
  const msRemaining = now !== null && endMs !== null ? endMs - now : null
  const endingSoon = msRemaining !== null && msRemaining <= ENDING_SOON_MINUTES * 60_000

  async function handleCheckIn() {
    if (!selected || !location || !captured || alreadyCheckedIn) return
    setSubmitting(true)
    setSubmitError("")

    const res = await checkInAction(selected.id, {
      latitude: location.lat,
      longitude: location.lng,
      deviceFingerprint: fingerprint.current,
      faceImageBase64: captured.split(",")[1],
    })

    setSubmitting(false)
    if (!res.ok) {
      setSubmitError(res.error)
      toastError(res.error)
      if (isFaceVerificationError(res.error)) {
        setFaceFailCount((c) => c + 1)
      }
      return
    }
    setFaceFailCount(0)
    setResult(res.data)
    toastSuccess(
      res.data.status === "LATE" ? "Checked in — late" : "You're checked in!",
      res.data.status === "PRESENT" ? "See you in class." : undefined
    )
  }

  async function handleRequestHelp() {
    if (!selected) return
    setHelpRequesting(true)
    setHelpError("")

    const res = await requestCheckInHelpAction(selected.id)
    setHelpRequesting(false)

    if (!res.ok) {
      setHelpError(res.error)
      toastError(res.error)
      return
    }
    setHelpSent(true)
    toastSuccess("Instructor notified")
  }

  const distance =
    location && selected ? haversineMeters(location.lat, location.lng, selected.latitude, selected.longitude) : null
  const inRange = distance != null && selected ? distance <= selected.radiusMeters : null

  const faceError = submitError && isFaceVerificationError(submitError) ? submitError : ""
  const otherError = submitError && !isFaceVerificationError(submitError) ? submitError : ""

  if (sessions.length === 0) {
    return (
      <div className={`w-full max-w-lg ${CARD} p-10 text-center space-y-3 animate-in fade-in duration-500`}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <ClockIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No active session right now</p>
          <p className="text-sm text-muted-foreground mt-1">
            Check back once your instructor starts the session.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/attendance/me">View my attendance history</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg space-y-5 pb-24 sm:pb-0 animate-in fade-in duration-500">
      {/* Session picker */}
     <div className={`${CARD} p-4 sm:p-5 space-y-3`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session</p>
          {selected && !alreadyCheckedIn && (
            <p className="text-[10px] text-muted-foreground tabular-nums">
              {[deviceReady, locationReady, faceRegistered ? captureReady : true].filter(Boolean).length}/
              {faceRegistered ? 3 : 2} ready
            </p>
          )}
        </div>
        {sessions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSessionId(s.id)}
                className="shrink-0 snap-start rounded-2xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm"
                style={
                  s.id === sessionId
                    ? { borderColor: NAVY, backgroundColor: `${NAVY}0D`, boxShadow: `0 0 0 1px ${NAVY}33` }
                    : undefined
                }
              >
                <p className="font-medium flex items-center gap-1.5">
                  {s.groupName}
                  {s.alreadyCheckedIn && <CheckCircleIcon className="size-3.5 text-emerald-600" />}
                </p>
                <p className="text-xs text-muted-foreground">{s.courseCode}</p>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5 transition-colors duration-300">
            <div>
              <p className="font-medium text-sm">{selected.groupName} · {selected.courseCode}</p>
              <p className="text-xs text-muted-foreground">{selected.zoneName}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] font-medium tabular-nums transition-all duration-300"
                style={
                  endingSoon
                    ? { backgroundColor: "rgb(254 228 230)", color: "rgb(225 29 72)" }
                    : { backgroundColor: `${NAVY}14`, color: NAVY }
                }
              >
                <ClockIcon className={`size-3.5 ${endingSoon ? "animate-pulse" : ""}`} />
                {now === null || msRemaining === null ? "--:--" : formatCountdown(msRemaining)}
              </div>
              {!hasStarted && !alreadyCheckedIn && startMs !== null && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 animate-in fade-in duration-300">
                  <SparklesIcon className="size-3" /> Early check-in open
                </span>
              )}
            </div>
          </div>
        )}
        {selected && !alreadyCheckedIn && (
          <ProgressRail deviceReady={deviceReady} locationReady={locationReady} captureReady={captureReady} faceRegistered={faceRegistered} />
        )}
      </div>

      {/* Already checked in — replaces the entire flow below for this session */}
      {selected && alreadyCheckedIn ? (
        <AlreadyCheckedInCard />
      ) : (
        <div className="space-y-5">
          {/* Step 1: device + location */}
          <div
            className={`${CARD} p-4 sm:p-5 space-y-4`}
            style={!deviceReady || !locationReady ? { boxShadow: `0 0 0 1px ${NAVY}26, 0 1px 2px rgba(0,0,0,0.04)` } : undefined}
          >
            <div className="flex items-center gap-2.5">
              <StepBadge index={1} done={deviceReady && locationReady} active />
              <p className="text-sm font-medium">Verify device &amp; location</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Device */}
              <div className="rounded-xl border p-3 space-y-2 transition-colors duration-300 hover:border-muted-foreground/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <SmartphoneIcon className="size-4" /> Device
                </div>
                {deviceReady ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 animate-in fade-in duration-300">
                    <ShieldCheckIcon className="size-3.5" /> Bound &amp; verified
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-amber-600">Not bound yet</p>
                    <Button size="sm" onClick={bindDevice} disabled={binding} className="w-full transition-transform active:scale-[0.98]">
                      {binding ? <LoaderIcon className="size-3.5 animate-spin" /> : <ShieldCheckIcon className="size-3.5" />}
                      {binding ? "Binding…" : "Bind this device"}
                    </Button>
                    {deviceError && <p className="text-xs text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">{deviceError}</p>}
                  </>
                )}
              </div>

              {/* Location */}
              <div className="rounded-xl border p-3 space-y-2 transition-colors duration-300 hover:border-muted-foreground/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPinIcon className="size-4" /> Location
                </div>
                {locating ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <LoaderIcon className="size-3.5 animate-spin" /> Locating…
                  </p>
                ) : location ? (
                  <div className="space-y-1 animate-in fade-in duration-300">
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircleIcon className="size-3.5" /> Captured (±{Math.round(location.accuracy)}m)
                    </p>
                    {distance != null && (
                      <p className={`text-xs transition-colors ${inRange ? "text-emerald-600" : "text-amber-600"}`}>
                        {Math.round(distance)}m from zone {inRange ? "· in range" : "· outside geofence"}
                      </p>
                    )}
                    <button onClick={getLocation} className="text-xs text-muted-foreground underline underline-offset-2 flex items-center gap-1 hover:text-foreground transition-colors">
                      <NavigationIcon className="size-3" /> Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-rose-600">{locError || "Not captured"}</p>
                    <Button size="sm" variant="outline" onClick={getLocation} className="w-full transition-transform active:scale-[0.98]">
                      <NavigationIcon className="size-3.5" /> Get my location
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: face scan */}
          <div
            className={`${CARD} p-4 sm:p-5 space-y-4`}
            style={deviceReady && locationReady && !captureReady ? { boxShadow: `0 0 0 1px ${NAVY}26, 0 1px 2px rgba(0,0,0,0.04)` } : undefined}
          >
            <div className="flex items-center gap-2.5">
              <StepBadge index={2} done={captureReady} active={deviceReady && locationReady} />
              <p className="text-sm font-medium">Scan your face</p>
            </div>

            {!faceRegistered ? (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 p-4 flex items-start gap-3">
                <AlertTriangleIcon className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Face not registered</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Register your face once to enable check-ins.
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/security/face">
                      Register face <ArrowRightIcon className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Hidden capture surface — never rendered visibly. Only the
                    FaceScanIndicator animation below is shown to the person. */}
                <video ref={videoRef} className="absolute -left-[9999px] w-64 h-64 -scale-x-100" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />

                <div className="rounded-xl bg-muted/40 py-8 flex items-center justify-center transition-colors duration-500">
                  <FaceScanIndicator phase={scanPhase} />
                </div>

                {camError && <p className="text-xs text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">{camError}</p>}

                <div className="flex gap-2">
                  {scanPhase === "idle" && (
                    <Button onClick={startFaceScan} className="flex-1 transition-transform active:scale-[0.98]" style={{ backgroundColor: NAVY }}>
                      <ScanFaceIcon className="size-4" /> Scan face
                    </Button>
                  )}
                  {scanPhase === "captured" && (
                    <Button onClick={retakeScan} variant="outline" className="flex-1 transition-transform active:scale-[0.98]">
                      <RotateCcwIcon className="size-4" /> Retake
                    </Button>
                  )}
                  {(scanPhase === "starting" || scanPhase === "scanning") && (
                    <Button disabled className="flex-1" style={{ backgroundColor: NAVY }}>
                      <LoaderIcon className="size-4 animate-spin" /> Scanning…
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* What's still missing, spelled out in plain language */}
          {missingRequirements.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertTriangleIcon className="size-3.5 shrink-0 mt-0.5" />
              <span>Before you can check in, you still need to {missingRequirements.join(", ")}.</span>
            </div>
          )}

          {/* Non-face errors — shown plainly */}
          {otherError && (
            <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-xl px-3 py-2.5 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <XCircleIcon className="size-4 shrink-0" /> {otherError}
            </p>
          )}

          {/* Face verification failed — clear alert with a one-tap retry, shown
              until the repeated-failure fallback below takes over. */}
          {faceError && !showFaceFallback && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 px-3.5 py-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
              <XCircleIcon className="size-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Scan not successful</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  We couldn't match your face. Try again with good lighting, facing the camera directly.
                </p>
                <button onClick={retakeScan} className="text-xs font-medium underline underline-offset-2 text-rose-700 dark:text-rose-400">
                  Retake scan
                </button>
              </div>
            </div>
          )}

          {/* Face-failure fallback — only appears after repeated failures */}
          {showFaceFallback && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start gap-2.5">
                <AlertTriangleIcon className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Face verification keeps failing
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    If you're sure this is you, try one of these — bad lighting from your original
                    registration photo is the most common cause.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="flex-1 transition-transform active:scale-[0.98]" asChild>
                  <Link href="/dashboard/security/face">
                    <RotateCcwIcon className="size-3.5" /> Re-register your face
                  </Link>
                </Button>

                <Button
                  size="sm"
                  className="flex-1 transition-transform active:scale-[0.98]"
                  style={{ backgroundColor: NAVY }}
                  onClick={handleRequestHelp}
                  disabled={helpRequesting || helpSent}
                >
                  {helpRequesting ? (
                    <LoaderIcon className="size-3.5 animate-spin" />
                  ) : helpSent ? (
                    <CheckCircleIcon className="size-3.5" />
                  ) : (
                    <MegaphoneIcon className="size-3.5" />
                  )}
                  {helpRequesting ? "Notifying…" : helpSent ? "Instructor notified" : "Notify my instructor"}
                </Button>
              </div>

              {helpError && <p className="text-xs text-rose-600">{helpError}</p>}
              {helpSent && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-300">
                  Your instructor can mark you present manually — no need to keep retrying.
                </p>
              )}
            </div>
          )}

          {/* Desktop / tablet — inline button */}
          <Button
            onClick={handleCheckIn}
            disabled={!canSubmit}
            className="hidden sm:flex w-full h-12 text-base font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            style={canSubmit ? { backgroundColor: NAVY, boxShadow: `0 8px 24px -8px ${NAVY}80` } : undefined}
          >
            {submitting ? <LoaderIcon className="size-5 animate-spin" /> : <CheckCircleIcon className="size-5" />}
            {submitting ? "Verifying…" : "Check In Now"}
          </Button>

          {/* Mobile — sticky bottom bar so the primary action stays one
              thumb-reach away regardless of scroll position. */}
          <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <Button
              onClick={handleCheckIn}
              disabled={!canSubmit}
              className="w-full h-12 text-base font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
              style={canSubmit ? { backgroundColor: NAVY, boxShadow: `0 8px 24px -8px ${NAVY}80` } : undefined}
            >
              {submitting ? <LoaderIcon className="size-5 animate-spin" /> : <CheckCircleIcon className="size-5" />}
              {submitting ? "Verifying…" : "Check In Now"}
            </Button>
          </div>
        </div>
      )}

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-3xl border bg-card p-6 sm:p-8 text-center space-y-4 shadow-2xl ring-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ${STATUS_STYLE[result.status].ring}`}>
            <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${STATUS_STYLE[result.status].bg}`}>
              {result.status === "ABSENT" ? (
                <XCircleIcon className={`size-9 ${STATUS_STYLE[result.status].text}`} />
              ) : (
                <CheckCircleIcon className={`size-9 ${STATUS_STYLE[result.status].text}`} />
              )}
            </div>
            <div>
              <p className={`text-2xl font-semibold ${STATUS_STYLE[result.status].text}`}>
                {result.status === "PRESENT" ? "You're checked in!" : result.status === "LATE" ? "Checked in — late" : "Check-in recorded"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(result.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {result.distanceMeters != null && ` · ${Math.round(result.distanceMeters)}m from zone`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 transition-transform active:scale-[0.98]" asChild>
                <Link href="/dashboard/attendance/me">View history</Link>
              </Button>
              <Button className="flex-1 transition-transform active:scale-[0.98]" style={{ backgroundColor: NAVY }} asChild>
                <Link href="/dashboard">Done</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}