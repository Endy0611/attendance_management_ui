"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { sessionApi, attendanceApi } from "@/lib/api"
import type { Session, Attendance } from "@/lib/api"
import { MapPinIcon, CheckCircleIcon, XCircleIcon, LoaderIcon, NavigationIcon } from "lucide-react"

export default function CheckInPage() {
  const params   = useSearchParams()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionId, setSessionId] = useState(params.get("sessionId") ?? "")
  const [location, setLocation]  = useState<{ lat: number; lng: number } | null>(null)
  const [locError, setLocError]  = useState("")
  const [checking, setChecking]  = useState(false)
  const [result,   setResult]    = useState<Attendance | null>(null)
  const [error,    setError]     = useState("")
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    sessionApi.myActive().then(setSessions).finally(() => setLoadingSessions(false))
  }, [])

  function getLocation() {
    setLocError("")
    if (!navigator.geolocation) { setLocError("Geolocation not supported by this browser."); return }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setLocError(`Location error: ${err.message}`),
      { enableHighAccuracy: true }
    )
  }

  async function handleCheckIn() {
    if (!sessionId) { setError("Please select a session"); return }
    if (!location)  { setError("Please get your location first"); return }
    setChecking(true); setError(""); setResult(null)
    try {
      const res = await attendanceApi.checkIn(sessionId, { latitude: location.lat, longitude: location.lng })
      setResult(res)
    } catch (e: any) { setError(e.message) }
    finally { setChecking(false) }
  }

  const STATUS_STYLE: Record<string, string> = {
    PRESENT: "text-green-600 bg-green-50 border-green-200",
    LATE:    "text-amber-600 bg-amber-50 border-amber-200",
    ABSENT:  "text-red-600 bg-red-50 border-red-200",
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
              <BreadcrumbItem><BreadcrumbPage>Check In</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 max-w-lg">
          <h1 className="text-2xl font-bold">Check In</h1>
          <p className="text-sm text-muted-foreground">Select your active session and share your location to check in.</p>

          {/* Session select */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Active Session</label>
            <select className="input w-full" value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={loadingSessions}>
              <option value="">{loadingSessions ? "Loading…" : "Select session"}</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.groupName} — {s.courseCode} (until {new Date(s.endTime).toLocaleTimeString()})</option>
              ))}
            </select>
            {sessions.length === 0 && !loadingSessions && (
              <p className="text-xs text-amber-600">No active sessions in your groups right now.</p>
            )}
          </div>

          {/* Location */}
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><MapPinIcon className="size-4" /> Your Location</p>
            {location
              ? (
                <div className="text-sm space-y-1">
                  <p className="text-green-600 flex items-center gap-1"><CheckCircleIcon className="size-4" /> Location captured</p>
                  <p className="text-muted-foreground text-xs">Lat: {location.lat.toFixed(6)} · Lng: {location.lng.toFixed(6)}</p>
                </div>
              )
              : <p className="text-sm text-muted-foreground">Location not yet captured.</p>}
            {locError && <p className="text-sm text-red-600">{locError}</p>}
            <button onClick={getLocation} className="btn-ghost flex items-center gap-2 text-sm">
              <NavigationIcon className="size-4" /> {location ? "Refresh Location" : "Get My Location"}
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Check In button */}
          <button
            onClick={handleCheckIn}
            disabled={checking || !sessionId || !location}
            className="btn-primary flex items-center justify-center gap-2 py-3 text-base">
            {checking ? <LoaderIcon className="size-5 animate-spin" /> : <CheckCircleIcon className="size-5" />}
            {checking ? "Checking in…" : "Check In Now"}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-5 text-center space-y-2 ${STATUS_STYLE[result.status]}`}>
              <p className="text-2xl font-bold">{result.status}</p>
              <p className="text-sm">Checked in at {new Date(result.checkedInAt).toLocaleTimeString()}</p>
              {result.distanceMeters != null && (
                <p className="text-xs">Distance from zone: {result.distanceMeters.toFixed(1)}m</p>
              )}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}