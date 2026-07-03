"use client"

import { useState } from "react"
import { createCourseAction, updateCourseAction } from "@/actions/course.action"
import type { CourseResponse } from "@/types/course-types"
import { LoaderIcon, XIcon } from "lucide-react"

interface CourseFormDialogProps {
  course: CourseResponse | null
  onClose: () => void
  onSaved: () => void
}

export function CourseFormDialog({ course, onClose, onSaved }: CourseFormDialogProps) {
  const [code, setCode] = useState(course?.code ?? "")
  const [name, setName] = useState(course?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const result = course
      ? await updateCourseAction(course.id, { code, name })
      : await createCourseAction({ code, name })

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
            {course ? "Edit Course" : "New Course"}
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
            <label className="text-xs font-medium text-muted-foreground">Course code</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. CS101"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Course name</label>
            <input
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
              placeholder="e.g. Introduction to Computer Science"
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
            {course ? "Save changes" : "Create course"}
          </button>
        </div>
      </div>
    </div>
  )
}