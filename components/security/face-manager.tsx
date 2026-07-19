"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { registerFaceAction } from "@/actions/face.action"
import { Button } from "@/components/ui/button"
import type { FaceStatusResponse } from "@/types/face-types"
import {
  ScanFaceIcon, CheckCircleIcon, CameraIcon, LoaderIcon,
  RotateCcwIcon, LockIcon, CheckIcon,
} from "lucide-react"

const NAVY = "#1C4D8D"

const CHECKS = [
  { key: "position", label: "Face positioned" },
  { key: "lighting", label: "Lighting checked" },
  { key: "quality", label: "Image quality verified" },
]

export function FaceManager({ initialStatus }: { initialStatus: FaceStatusResponse | null }) {
  const [status, setStatus] = useState(initialStatus)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [checksDone, setChecksDone] = useState(0)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (!captured) {
      setChecksDone(0)
      return
    }
    const timers = CHECKS.map((_, i) =>
      setTimeout(() => setChecksDone(i + 1), 350 + i * 350)
    )
    return () => timers.forEach(clearTimeout)
  }, [captured])

  async function startCamera() {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStreaming(true)
      setCaptured(null)
    } catch {
      setError("Camera access was denied. Enable it in your browser settings and try again.")
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
    setSuccess("")
    startCamera()
  }

  async function register() {
    if (!captured) return
    setSaving(true)
    setError("")
    setSuccess("")

    const result = await registerFaceAction({ imageBase64: captured.split(",")[1] })
    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    setStatus(result.data)
    setCaptured(null)
    setSuccess("Face registered successfully!")
  }

  const isVerified = !!status?.faceRegistered
  const allChecksDone = checksDone === CHECKS.length

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Register your face once — it's compared against a live selfie every time you check in.
        </p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 pt-0.5">
          <LockIcon className="size-3" />
          Encrypted
        </div>
      </div>

      {/* Status line */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`size-1.5 rounded-full ${isVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="font-medium">
          {isVerified ? "Biometric ID verified" : "Not yet registered"}
        </span>
        {status?.registeredAt && (
          <span className="text-muted-foreground">
            · {new Date(status.registeredAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Scanner card — light, clean */}
      <div className="rounded-2xl border bg-muted/30 overflow-hidden">
        <div className="py-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-56 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center relative">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover -scale-x-100 ${streaming ? "" : "hidden"}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              <AnimatePresence mode="wait">
                {captured ? (
                  <motion.img
                    key="captured"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={captured}
                    alt="Captured"
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  !streaming && (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-muted-foreground/40"
                    >
                      <ScanFaceIcon className="size-9" strokeWidth={1.5} />
                    </motion.div>
                  )
                )}
              </AnimatePresence>

              {/* Scan bar sweeps inside the circle while live */}
              {streaming && !captured && (
                <motion.div
                  className="absolute left-3 right-3 h-[2px] rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${NAVY}, #7DD3FC, ${NAVY}, transparent)`,
                    boxShadow: "0 0 8px 1px rgba(28,77,141,0.5)",
                  }}
                  animate={{ top: ["18%", "82%", "18%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </div>

            {/* Ring — color shifts by state */}
            <motion.div
              animate={{
                borderColor: captured
                  ? "rgba(52, 211, 153, 0.9)"
                  : streaming
                    ? NAVY
                    : "var(--border)",
              }}
              transition={{ duration: 0.3 }}
              className="absolute -inset-2 rounded-full border-2 pointer-events-none"
            />

            {/* Breathing pulse only while idle */}
            {!streaming && !captured && (
              <motion.div
                className="absolute -inset-2 rounded-full border-2 border-border pointer-events-none"
                animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>

          {/* Caption below the circle */}
          <AnimatePresence mode="wait">
            <motion.p
              key={captured ? (allChecksDone ? "done" : "verifying") : streaming ? "scanning" : "idle"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium text-muted-foreground"
            >
              {captured
                ? allChecksDone
                  ? "Verification complete"
                  : "Verifying…"
                : streaming
                  ? "Center your face in the circle"
                  : "Camera preview will appear here"}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Verification checklist — light theme, only after capture */}
        <AnimatePresence>
          {captured && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t bg-card px-5 py-3.5 space-y-2 overflow-hidden"
            >
              {CHECKS.map((check, i) => {
                const done = i < checksDone
                return (
                  <div key={check.key} className="flex items-center gap-2.5">
                    <motion.div
                      animate={{
                        backgroundColor: done ? "rgb(16,185,129)" : "var(--muted)",
                        scale: done ? 1 : 0.9,
                      }}
                      transition={{ duration: 0.2 }}
                      className="size-4 rounded-full flex items-center justify-center shrink-0"
                    >
                      {done && <CheckIcon className="size-2.5 text-white" strokeWidth={3} />}
                    </motion.div>
                    <span className={`text-xs transition-colors ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {check.label}
                    </span>
                  </div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2"
          >
            {success}
          </motion.p>
        )}
      </AnimatePresence>

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
          <>
            <Button onClick={retake} variant="outline" className="flex-1">
              <RotateCcwIcon className="size-4" /> Retake
            </Button>
            <Button
              onClick={register}
              disabled={saving || !allChecksDone}
              className="flex-1"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
              {saving ? "Registering…" : isVerified ? "Update face" : "Register face"}
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Make sure your face is clearly visible, well-lit, and centered in the frame.
      </p>
    </div>
  )
}