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
  SmartphoneIcon, ShieldCheckIcon, ScanFaceIcon, CameraIcon, ClockIcon,
  RotateCcwIcon, AlertTriangleIcon, ArrowRightIcon, MegaphoneIcon,
} from "lucide-react"

const NAVY = "#1C4D8D"

// After this many consecutive face-verification failures on a single
// submission attempt, stop just saying "try again" and surface real
// fallback paths — most false negatives clear up in 1-2 retries; beyond
// that, retrying blindly just frustrates a student who IS the real owner.
const FACE_FAIL_FALLBACK_THRESHOLD = 2

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
  if (ms <= 0) return "Ending…"
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

const STATUS_STYLE: Record<string, { text: string; bg: string; ring: string }> = {
  PRESENT: { text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", ring: "ring-emerald-500/20" },
  LATE: { text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", ring: "ring-amber-500/20" },
  ABSENT: { text: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950", ring: "ring-rose-500/20" },
}

function StepBadge({ index, done, active }: { index: number; done: boolean; active: boolean }) {
  return (
    <div
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
      style={
        done
          ? { backgroundColor: NAVY, color: "white" }
          : active
            ? { backgroundColor: `${NAVY}1A`, color: NAVY, border: `1.5px solid ${NAVY}` }
            : undefined
      }
    >
      {done ? <CheckCircleIcon className="size-4" /> : index}
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
  const [streaming, setStreaming] = useState(false)
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
    return () => stopCamera()
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

  async function startCamera() {
    setCamError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStreaming(true)
      setCaptured(null)
    } catch {
      setCamError("Camera access was denied. Enable it in your browser settings and try again.")
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
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

  function retake() {
    setCaptured(null)
    startCamera()
  }

  const deviceReady = !!device
  const locationReady = !!location
  const faceRegistered = !!faceStatus?.faceRegistered
  const captureReady = !!captured
  const canSubmit = !!selected && deviceReady && locationReady && faceRegistered && captureReady && !submitting
  const showFaceFallback = faceFailCount >= FACE_FAIL_FALLBACK_THRESHOLD

  async function handleCheckIn() {
    if (!selected || !location || !captured) return
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

  if (sessions.length === 0) {
    return (
      <div className="w-full max-w-lg rounded-2xl border bg-card p-10 text-center space-y-3">
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
    <div className="w-full max-w-lg space-y-6">
      {/* Session picker */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Session</p>
        {sessions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSessionId(s.id)}
                className="shrink-0 rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                style={s.id === sessionId ? { borderColor: NAVY, backgroundColor: `${NAVY}0D` } : undefined}
              >
                <p className="font-medium">{s.groupName}</p>
                <p className="text-xs text-muted-foreground">{s.courseCode}</p>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
            <div>
              <p className="font-medium text-sm">{selected.groupName} · {selected.courseCode}</p>
              <p className="text-xs text-muted-foreground">{selected.zoneName}</p>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] font-medium"
              style={{ backgroundColor: `${NAVY}14`, color: NAVY }}
            >
              <ClockIcon className="size-3.5" />
{now === null ? "--:--" : formatCountdown(new Date(selected.endTime).getTime() - now)}
            </div>
          </div>
        )}
      </div>

      {/* Step 1: device + location */}
      <div className="rounded-2xl border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2.5">
          <StepBadge index={1} done={deviceReady && locationReady} active />
          <p className="text-sm font-medium">Verify device &amp; location</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
          {/* Device */}
          <div className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SmartphoneIcon className="size-4" /> Device
            </div>
            {deviceReady ? (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <ShieldCheckIcon className="size-3.5" /> Bound &amp; verified
              </p>
            ) : (
              <>
                <p className="text-xs text-amber-600">Not bound yet</p>
                <Button size="sm" onClick={bindDevice} disabled={binding} className="w-full">
                  {binding ? <LoaderIcon className="size-3.5 animate-spin" /> : <ShieldCheckIcon className="size-3.5" />}
                  {binding ? "Binding…" : "Bind this device"}
                </Button>
                {deviceError && <p className="text-xs text-rose-600">{deviceError}</p>}
              </>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPinIcon className="size-4" /> Location
            </div>
            {locating ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <LoaderIcon className="size-3.5 animate-spin" /> Locating…
              </p>
            ) : location ? (
              <div className="space-y-1">
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircleIcon className="size-3.5" /> Captured (±{Math.round(location.accuracy)}m)
                </p>
                {distance != null && (
                  <p className={`text-xs ${inRange ? "text-emerald-600" : "text-amber-600"}`}>
                    {Math.round(distance)}m from zone {inRange ? "· in range" : "· outside geofence"}
                  </p>
                )}
                <button onClick={getLocation} className="text-xs text-muted-foreground underline underline-offset-2 flex items-center gap-1">
                  <NavigationIcon className="size-3" /> Refresh
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-rose-600">{locError || "Not captured"}</p>
                <Button size="sm" variant="outline" onClick={getLocation} className="w-full">
                  <NavigationIcon className="size-3.5" /> Get my location
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: face scan */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <StepBadge index={2} done={captureReady} active={deviceReady && locationReady} />
          <p className="text-sm font-medium">Scan your face</p>
        </div>

        {!faceRegistered ? (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 p-4 flex items-start gap-3">
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
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-muted flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover -scale-x-100 ${streaming ? "" : "hidden"}`} playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              {captured ? (
                <img src={captured} alt="Captured face" className="w-full h-full object-cover -scale-x-100 animate-in fade-in zoom-in-95 duration-300" />
              ) : streaming ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="size-40 rounded-full border-2 border-dashed border-white/70" />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    Center your face in the circle
                  </span>
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">
                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
                  </span>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ScanFaceIcon className="size-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {camError && <p className="text-xs text-rose-600">{camError}</p>}

            <div className="flex gap-2">
              {!streaming && !captured && (
                <Button onClick={startCamera} className="flex-1" style={{ backgroundColor: NAVY }}>
                  <CameraIcon className="size-4" /> Open camera
                </Button>
              )}
              {streaming && (
                <Button onClick={capture} className="flex-1" style={{ backgroundColor: NAVY }}>
                  <ScanFaceIcon className="size-4" /> Capture
                </Button>
              )}
              {captured && (
                <Button onClick={retake} variant="outline" className="flex-1">
                  <RotateCcwIcon className="size-4" /> Retake
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {submitError && (
        <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <XCircleIcon className="size-4 shrink-0" /> {submitError}
        </p>
      )}

      {/* Face-failure fallback — only appears after repeated failures */}
      {showFaceFallback && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950 p-4 space-y-3">
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
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href="/dashboard/security/face">
                <RotateCcwIcon className="size-3.5" /> Re-register your face
              </Link>
            </Button>

            <Button
              size="sm"
              className="flex-1"
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
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Your instructor can mark you present manually — no need to keep retrying.
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleCheckIn}
        disabled={!canSubmit}
        className="w-full h-12 text-base font-medium"
        style={canSubmit ? { backgroundColor: NAVY } : undefined}
      >
        {submitting ? <LoaderIcon className="size-5 animate-spin" /> : <CheckCircleIcon className="size-5" />}
        {submitting ? "Verifying…" : "Check In Now"}
      </Button>

      {/* Result overlay */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-3xl border bg-card p-8 text-center space-y-4 shadow-xl ring-4 animate-in zoom-in-95 duration-300 ${STATUS_STYLE[result.status].ring}`}>
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
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/attendance/me">View history</Link>
              </Button>
              <Button className="flex-1" style={{ backgroundColor: NAVY }} asChild>
                <Link href="/dashboard">Done</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}