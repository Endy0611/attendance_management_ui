"use client"

import { useEffect, useState } from "react"
import { bindDeviceAction } from "@/actions/device.action"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import type { DeviceResponse } from "@/types/device-types"
import { SmartphoneIcon, CheckCircleIcon, LoaderIcon, ShieldCheckIcon } from "lucide-react"

const NAVY = "#1C4D8D"

export function DeviceManager({ initialDevice }: { initialDevice: DeviceResponse | null }) {
  const [device, setDevice] = useState(initialDevice)
  const [binding, setBinding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Computed client-side only, after hydration — matching this on the server
  // pass would be meaningless (no navigator/screen there), so it starts blank
  // and fills in via effect, same as the old page did.
  const [fp, setFp] = useState("")
  const [userAgent, setUserAgent] = useState("")
  useEffect(() => {
    setFp(generateDeviceFingerprint())
    setUserAgent(navigator.userAgent)
  }, [])

  async function bindDevice() {
    setBinding(true)
    setError("")
    setSuccess("")
    const result = await bindDeviceAction({ fingerprint: fp, deviceInfo: navigator.userAgent })
    setBinding(false)

    if (!result.ok) {
      setError(result.error)
      toastError(result.error)
      return
    }
    setDevice(result.data)
    setSuccess("Device bound successfully! You can now check in.")
    toastSuccess("Device bound", "You can now check in.")
  }

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">
        Binding your device ensures attendance is verified from your personal device only.
        Contact your admin to reset your device if you change phones.
      </p>

      {device ? (
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950 border-emerald-200 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="size-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Device Bound</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Bound on {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-white/50 dark:bg-black/20 rounded-lg p-3 break-all">
            <p className="font-medium mb-1">Device Info</p>
            <p>{device.deviceInfo}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950 border-amber-200 p-5 flex items-center gap-3">
          <SmartphoneIcon className="size-6 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">No Device Bound</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">You need to bind this device to check in.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 text-sm space-y-2">
        <p className="font-medium flex items-center gap-2">
          <SmartphoneIcon className="size-4" /> This Device
        </p>
        <p className="text-xs text-muted-foreground break-all">{userAgent}</p>
        <p className="text-xs text-muted-foreground">
          Fingerprint: <code className="bg-muted px-1 rounded">{fp}</code>
        </p>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2">{success}</p>}

      {!device && (
        <Button onClick={bindDevice} disabled={binding || !fp} className="w-full h-11" style={{ backgroundColor: NAVY }}>
          {binding ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
          {binding ? "Binding…" : "Bind This Device"}
        </Button>
      )}
    </div>
  )
}