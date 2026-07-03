"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { deviceApi } from "@/lib/api"
import type { Device } from "@/lib/api"
import { SmartphoneIcon, CheckCircleIcon, LoaderIcon, ShieldCheckIcon } from "lucide-react"

function generateFingerprint(): string {
  const nav = navigator
  const parts = [
    nav.userAgent,
    nav.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? "?",
  ]
  let hash = 0
  const str = parts.join("|")
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}

export default function DevicePage() {
  const [device,   setDevice]   = useState<Device | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [binding,  setBinding]  = useState(false)
  const [error,    setError]    = useState("")
  const [success,  setSuccess]  = useState("")
  const [fp,       setFp]       = useState("")

  useEffect(() => {
    setFp(generateFingerprint())
    deviceApi.myDevice()
      .then(setDevice)
      .catch(() => setDevice(null))
      .finally(() => setLoading(false))
  }, [])

  async function bindDevice() {
    setBinding(true); setError(""); setSuccess("")
    try {
      const bound = await deviceApi.bind({
        fingerprint: fp,
        deviceInfo:  navigator.userAgent,
      })
      setDevice(bound)
      setSuccess("Device bound successfully! You can now check in.")
    } catch (e: any) { setError(e.message) }
    finally { setBinding(false) }
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
              <BreadcrumbItem><BreadcrumbPage>Device Binding</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-6 max-w-lg">
          <h1 className="text-2xl font-bold">Device Binding</h1>
          <p className="text-sm text-muted-foreground">
            Binding your device ensures attendance is verified from your personal device only.
            Contact your admin to reset your device if you change phones.
          </p>

          {loading
            ? <div className="h-24 rounded-xl bg-muted animate-pulse" />
            : device
              ? (
                <div className="rounded-xl border bg-green-50 dark:bg-green-950 border-green-200 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="size-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300">Device Bound</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Bound on {new Date(device.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg p-3 break-all">
                    <p className="font-medium mb-1">Device Info</p>
                    <p>{device.deviceInfo}</p>
                  </div>
                </div>
              )
              : (
                <div className="rounded-xl border bg-amber-50 dark:bg-amber-950 border-amber-200 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <SmartphoneIcon className="size-6 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300">No Device Bound</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">You need to bind this device to check in.</p>
                    </div>
                  </div>
                </div>
              )}

          {/* Device fingerprint info */}
          <div className="rounded-xl border bg-card p-4 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2"><SmartphoneIcon className="size-4" /> This Device</p>
            <p className="text-xs text-muted-foreground break-all">{navigator.userAgent}</p>
            <p className="text-xs text-muted-foreground">Fingerprint: <code className="bg-muted px-1 rounded">{fp}</code></p>
          </div>

          {error   && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          {!device && (
            <button onClick={bindDevice} disabled={binding} className="btn-primary flex items-center justify-center gap-2 py-3">
              {binding ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
              {binding ? "Binding…" : "Bind This Device"}
            </button>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}