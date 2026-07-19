"use client"

import { useEffect, useState } from "react"
import { createGroupAction, updateGroupAction, getCourseOptionsAction, getInstructorOptionsAction, getMajorOptionsAction } from "@/actions/group.action"
import type { GroupResponse } from "@/types/group-types"
import type { CourseResponse } from "@/types/course-types"
import type { MajorResponse } from "@/types/major-types"
import type { AppUserResponse } from "@/types/auth-types"
import { LoaderIcon, XIcon, LayersIcon } from "lucide-react"

// Navy accent — matches the course dialog colors.
const NAVY = "#1C4D8D"
const NAVY_SOFT = "#1C4D8D14"

interface GroupFormDialogProps {
  group: GroupResponse | null
  onClose: () => void
  onSaved: () => void
}

const fieldClass =
  "mt-1 w-full rounded-lg border-2 bg-background px-3 py-2 text-sm outline-none focus:ring-2"

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

  function focusRing(e: React.FocusEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = NAVY
    e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY_SOFT}`
  }
  function blurRing(e: React.FocusEvent<HTMLElement>) {
    e.currentTarget.style.borderColor = ""
    e.currentTarget.style.boxShadow = ""
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="h-1.5 sticky top-0" style={{ backgroundColor: NAVY }} />
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: NAVY }}
              >
                <LayersIcon className="size-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
                  {group ? "Edit group" : "New group"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group ? "Update group details" : "Create a section under a course"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="icon-btn -mr-1.5 -mt-1.5">
              <XIcon className="size-4" />
            </button>
          </div>

          {error && <p className="text-sm text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">{error}</p>}

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
                <select className={fieldClass} value={courseId} onChange={(e) => setCourseId(e.target.value)} onFocus={focusRing} onBlur={blurRing}>
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Group name</label>
                <input
                  className={fieldClass}
                  placeholder="e.g. CS101 - Section A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={focusRing}
                  onBlur={blurRing}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Instructor</label>
                <select className={fieldClass} value={instructorId} onChange={(e) => setInstructorId(e.target.value)} onFocus={focusRing} onBlur={blurRing}>
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
                    className={fieldClass}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Semester</label>
                  <input
                    className={fieldClass}
                    placeholder="e.g. Fall 2026"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Major</label>
                  <select className={fieldClass} value={majorId} onChange={(e) => setMajorId(e.target.value)} onFocus={focusRing} onBlur={blurRing}>
                    <option value="">None</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.code} — {m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Shift</label>
                  <input
                    className={fieldClass}
                    placeholder="e.g. Evening"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    onFocus={focusRing}
                    onBlur={blurRing}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-sm px-3.5 py-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || loadingOptions || !courseId || !name.trim() || !instructorId}
              className="min-w-28 flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : group ? "Save changes" : "Create group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}