"use client"

import { useState } from "react"
import { createMajorAction, updateMajorAction } from "@/actions/major.action"
import type { MajorResponse } from "@/types/major-types"
import { LoaderIcon, XIcon } from "lucide-react"

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">
            {major ? "Edit Major" : "New Major"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Major code</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. CS"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Major name</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. Computer Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !code.trim() || !name.trim()}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            {saving && <LoaderIcon className="size-3.5 animate-spin" />}
            {major ? "Save changes" : "Create major"}
          </button>
        </div>
      </div>
    </div>
  )
}
