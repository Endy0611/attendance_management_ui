"use client"

import { useState } from "react"
import { createMajorAction, updateMajorAction } from "@/actions/major.action"
import type { MajorResponse } from "@/types/major-types"
import { LoaderIcon, XIcon, GraduationCapIcon } from "lucide-react"

// Navy accent — matches the course & group dialogs.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

interface MajorFormDialogProps {
  major: MajorResponse | null
  onClose: () => void
  onSaved: () => void
}

export function MajorFormDialog({ major, onClose, onSaved }: MajorFormDialogProps) {
  const [code, setCode] = useState(major?.code ?? "")
  const [name, setName] = useState(major?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const result = major
      ? await updateMajorAction(major.id, { code, name })
      : await createMajorAction({ code, name })

    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  function focusRing(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = NAVY
    e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY_SOFT}`
  }
  function blurRing(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = ""
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="h-1.5" style={{ backgroundColor: NAVY }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: NAVY }}
              >
                <GraduationCapIcon className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
                  {major ? "Edit major" : "New major"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {major ? "Update major details" : "Add a new major to the catalog"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5 -mt-1.5">
              <XIcon className="size-4" />
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid gap-3.5">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Major code</span>
              <input
                className="w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="e.g. CS"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onFocus={focusRing}
                onBlur={blurRing}
                maxLength={8}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Major name</span>
              <input
                className="w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="e.g. Computer Science"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={focusRing}
                onBlur={blurRing}
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="text-sm px-3.5 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !code.trim() || !name.trim()}
              className="min-w-28 flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : major ? "Save changes" : "Create major"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}