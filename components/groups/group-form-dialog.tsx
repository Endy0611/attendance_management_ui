"use client"

import { useEffect, useState } from "react"
import { createGroupAction, updateGroupAction, getCourseOptionsAction, getInstructorOptionsAction, getMajorOptionsAction } from "@/actions/group.action"
import type { GroupResponse } from "@/types/group-types"
import type { CourseResponse } from "@/types/course-types"
import type { MajorResponse } from "@/types/major-types"
import type { AppUserResponse } from "@/types/auth-types"
import { LoaderIcon, XIcon } from "lucide-react"

interface GroupFormDialogProps {
  group: GroupResponse | null
  onClose: () => void
  onSaved: () => void
}

export function GroupFormDialog({ group, onClose, onSaved }: GroupFormDialogProps) {
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [instructors, setInstructors] = useState<AppUserResponse[]>([])
  const [majors, setMajors] = useState<MajorResponse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  const [courseId, setCourseId] = useState(group?.courseId ?? "")
  const [name, setName] = useState(group?.name ?? "")
  const [instructorId, setInstructorId] = useState(group?.instructorId ?? "")
  const [capacity, setCapacity] = useState(group?.capacity ?? 30)
  const [semester, setSemester] = useState(group?.semester ?? "")
  const [majorId, setMajorId] = useState(group?.majorId ?? "")
  const [shift, setShift] = useState(group?.shift ?? "")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getCourseOptionsAction(), getInstructorOptionsAction(), getMajorOptionsAction()]).then(([c, i, m]) => {
      if (c.ok) setCourses(c.data)
      if (i.ok) setInstructors(i.data)
      if (m.ok) setMajors(m.data)
      setLoadingOptions(false)
    })
  }, [])

  async function handleSubmit() {
    setSaving(true)
    setError("")

    const input = {
      courseId, name, instructorId, capacity: Number(capacity),
      semester: semester || undefined,
      majorId: majorId || undefined,
      shift: shift || undefined,
    }
    const result = group ? await updateGroupAction(group.id, input) : await createGroupAction(input)

    setSaving(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-display)]">
            {group ? "Edit Group" : "New Group"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="size-4" />
          </button>
        </div>

        {error && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

        {loadingOptions ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Course</label>
              <select
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Group name</label>
              <input
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                placeholder="e.g. CS101 - Section A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Instructor</label>
              <select
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
              >
                <option value="">Select an instructor</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Capacity</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Semester</label>
                <input
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                  placeholder="e.g. Fall 2026"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Major</label>
                <select
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                  value={majorId}
                  onChange={(e) => setMajorId(e.target.value)}
                >
                  <option value="">None</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Shift</label>
                <input
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                  placeholder="e.g. Evening"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loadingOptions || !courseId || !name.trim() || !instructorId}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: "#1C4D8D" }}
          >
            {saving && <LoaderIcon className="size-3.5 animate-spin" />}
            {group ? "Save changes" : "Create group"}
          </button>
        </div>
      </div>
    </div>
  )
}