"use client"

import { useEffect, useState } from "react"
import { bindDeviceAction } from "@/actions/device.action"
import { generateDeviceFingerprint } from "@/lib/device-fingerprint"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import type { DeviceResponse } from "@/types/device-types"
import { SmartphoneIcon, CheckCircleIcon, LoaderIcon, ShieldCheckIcon, FingerprintIcon } from "lucide-react"

const NAVY = "#1C4D8D"

export function DeviceManager({ initialDevice }: { initialDevice: DeviceResponse | null }) {
  const [device, setDevice] = useState(initialDevice)
  const [binding, setBinding] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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

      {/* Status card */}
      {device ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <ShieldCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Device bound</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Secured on {new Date(device.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/60 dark:bg-black/20 border border-emerald-200/60 dark:border-emerald-900/60 p-3">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
              Registered device
            </p>
            <p className="text-xs text-muted-foreground break-all leading-relaxed">{device.deviceInfo}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
              <SmartphoneIcon className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">No device bound</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Bind this device before you can check in.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* This device — fingerprint card, echoes the scanner's "identity" feel */}
      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0" style={{ color: NAVY }}>
            <SmartphoneIcon className="size-4" />
          </div>
          <p className="font-medium text-sm">This device</p>
        </div>

        <div className="space-y-2 pl-[42px]">
          <p className="text-xs text-muted-foreground break-all leading-relaxed">{userAgent || "Detecting…"}</p>

          <div className="flex items-center gap-2 pt-1">
            <FingerprintIcon className="size-3.5 text-muted-foreground shrink-0" />
            <code className="text-xs bg-muted px-2 py-1 rounded-md font-mono text-muted-foreground truncate">
              {fp || "Generating fingerprint…"}
            </code>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2">{success}</p>}

      {!device && (
        <Button onClick={bindDevice} disabled={binding || !fp} className="w-full h-11" style={{ backgroundColor: NAVY }}>
          {binding ? <LoaderIcon className="size-4 animate-spin" /> : <CheckCircleIcon className="size-4" />}
          {binding ? "Binding…" : "Bind this device"}
        </Button>
      )}
    </div>
  )
}