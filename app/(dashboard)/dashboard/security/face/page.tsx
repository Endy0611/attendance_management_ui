"use client"

import { useEffect, useRef, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { faceApi } from "@/lib/api"
import type { FaceStatus } from "@/lib/api"
import { ScanFaceIcon, CheckCircleIcon, CameraIcon, LoaderIcon } from "lucide-react"

export default function FacePage() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [status,    setStatus]    = useState<FaceStatus | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [captured,  setCaptured]  = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState("")

  useEffect(() => {
    faceApi.myStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false))
    return () => { stopCamera() }
  }, [])

  async function startCamera() {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      setStreaming(true); setCaptured(null)
    } catch { setError("Camera access denied. Please allow camera permissions.") }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setStreaming(false)
  }

  function capture() {
    if (!videoRef.current || !canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")!
    canvasRef.current.width  = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    ctx.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvasRef.current.toDataURL("image/jpeg")
    setCaptured(dataUrl)
    stopCamera()
  }

  async function register() {
    if (!captured) return
    setSaving(true); setError(""); setSuccess("")
    try {
      const base64 = captured.split(",")[1]
      const updated = await faceApi.register(base64)
      setStatus(updated)
      setCaptured(null)
      setSuccess("Face registered successfully!")
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

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
              <BreadcrumbItem><BreadcrumbPage>Face Registration</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 max-w-lg">
          <h1 className="text-2xl font-bold">Face Registration</h1>

          {/* Status */}
          {loading
            ? <div className="h-16 rounded-xl bg-muted animate-pulse" />
            : (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${status?.faceRegistered ? "bg-green-50 border-green-200 dark:bg-green-950" : "bg-amber-50 border-amber-200 dark:bg-amber-950"}`}>
                {status?.faceRegistered
                  ? <CheckCircleIcon className="size-6 text-green-600" />
                  : <ScanFaceIcon className="size-6 text-amber-600" />}
                <div>
                  <p className="font-medium text-sm">
                    {status?.faceRegistered ? "Face Registered" : "Not Yet Registered"}
                  </p>
                  {status?.registeredAt && (
                    <p className="text-xs text-muted-foreground">Registered on {new Date(status.registeredAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

          {/* Camera */}
          <div className="rounded-xl border bg-card overflow-hidden aspect-video relative bg-muted flex items-center justify-center">
            <video ref={videoRef} className={`w-full h-full object-cover ${streaming ? "" : "hidden"}`} playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {captured
              ? <img src={captured} alt="Captured" className="w-full h-full object-cover" />
              : !streaming && (
                <div className="text-center text-muted-foreground">
                  <CameraIcon className="size-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Camera preview</p>
                </div>
              )}
          </div>

          {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          <div className="flex gap-2">
            {!streaming && !captured && (
              <button onClick={startCamera} className="btn-primary flex items-center gap-2 flex-1">
                <CameraIcon className="size-4" /> Open Camera
              </button>
            )}
            {streaming && (
              <button onClick={capture} className="btn-primary flex items-center gap-2 flex-1">
                <ScanFaceIcon className="size-4" /> Capture
              </button>
            )}
            {captured && (
              <>
                <button onClick={() => { setCaptured(null) }} className="btn-ghost flex-1">Retake</button>
                <button onClick={register} disabled={saving} className="btn-primary flex items-center gap-2 flex-1">
                  {saving ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
                  {saving ? "Registering…" : status?.faceRegistered ? "Update Face" : "Register Face"}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Make sure your face is clearly visible, well-lit, and centered in the frame.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}