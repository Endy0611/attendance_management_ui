"use client"

import { useEffect, useRef, useState } from "react"
import { registerFaceAction } from "@/actions/face.action"
import { Button } from "@/components/ui/button"
import type { FaceStatusResponse } from "@/types/face-types"
import { ScanFaceIcon, CheckCircleIcon, CameraIcon, LoaderIcon, RotateCcwIcon } from "lucide-react"

const NAVY = "#1C4D8D"

export function FaceManager({ initialStatus }: { initialStatus: FaceStatusResponse | null }) {
  const [status, setStatus] = useState(initialStatus)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    return () => stopCamera()
  }, [])

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

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">
        Register your face once — it's compared against a live selfie every time you check in.
        Use good lighting and a clear, front-facing photo for the most reliable match.
      </p>

      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          status?.faceRegistered
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950"
        }`}
      >
        {status?.faceRegistered ? (
          <CheckCircleIcon className="size-6 text-emerald-600" />
        ) : (
          <ScanFaceIcon className="size-6 text-amber-600" />
        )}
        <div>
          <p className="font-medium text-sm">
            {status?.faceRegistered ? "Face Registered" : "Not Yet Registered"}
          </p>
          {status?.registeredAt && (
            <p className="text-xs text-muted-foreground">
              Registered on {new Date(status.registeredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden aspect-video relative bg-muted flex items-center justify-center">
        <video ref={videoRef} className={`w-full h-full object-cover -scale-x-100 ${streaming ? "" : "hidden"}`} playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {captured ? (
          <img src={captured} alt="Captured" className="w-full h-full object-cover -scale-x-100" />
        ) : (
          !streaming && (
            <div className="text-center text-muted-foreground">
              <CameraIcon className="size-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Camera preview</p>
            </div>
          )
        )}
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2">{success}</p>}

      <div className="flex gap-2">
        {!streaming && !captured && (
          <Button onClick={startCamera} className="flex-1" style={{ backgroundColor: NAVY }}>
            <CameraIcon className="size-4" /> Open Camera
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
            <Button onClick={register} disabled={saving} className="flex-1" style={{ backgroundColor: NAVY }}>
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
              {saving ? "Registering…" : status?.faceRegistered ? "Update Face" : "Register Face"}
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