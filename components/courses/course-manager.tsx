"use client"

import { useState, useTransition } from "react"
import { getCoursesAction, deleteCourseAction } from "@/actions/course.action"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import type { CourseResponse } from "@/types/course-types"
import { toastSuccess, toastError } from "@/lib/toast"
import {
  PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon,
  BookOpenIcon, LayersIcon, AlertTriangleIcon, XIcon,
} from "lucide-react"

const NAVY = "#1C4D8D"

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, loading }: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-9 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <AlertTriangleIcon className="size-4.5" />
          </div>
          <p className="text-sm leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading} className="px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="min-w-24 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? <LoaderIcon className="size-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CourseManager({ initialCourses }: { initialCourses: CourseResponse[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<CourseResponse | "create" | null>(null)
  const [toDelete, setToDelete] = useState<CourseResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isRefreshing, startRefresh] = useTransition()

  function refresh() {
    startRefresh(async () => {
      const result = await getCoursesAction()
      if (result.ok) setCourses(result.data)
    })
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const result = await deleteCourseAction(toDelete.id)
    setDeleting(false)
    setToDelete(null)

    if (!result.ok) {
      toastError(result.error)
      return
    }
    toastSuccess("Course deleted")
    refresh()
  }

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalGroups = courses.reduce((a, c) => a + c.groupCount, 0)
  const avgGroups = courses.length > 0 ? (totalGroups / courses.length).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight font-[family-name:var(--font-display)]">
            Courses
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courses.length} course{courses.length === 1 ? "" : "s"} total
          </p>
        </div>
        <button
          onClick={() => setDialog("create")}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: NAVY }}
        >
          <PlusIcon className="size-4" />
          New Course
        </button>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: "Courses", value: courses.length, icon: <BookOpenIcon className="size-3.5" /> },
          { label: "Groups", value: totalGroups, icon: <LayersIcon className="size-3.5" /> },
          { label: "Avg groups / course", value: avgGroups, icon: <LayersIcon className="size-3.5" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-3.5 py-2.5">
            <div className="flex items-center gap-1.5" style={{ color: NAVY }}>
              {s.icon}
              <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-lg font-semibold tracking-tight mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border-2 bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/15"
          style={{ borderColor: search ? NAVY : undefined }}
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => (e.currentTarget.style.borderColor = NAVY)}
          onBlur={(e) => (e.currentTarget.style.borderColor = search ? NAVY : "")}
        />
      </div>

      {/* Grid */}
      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${NAVY}12`, color: NAVY }}>
            <BookOpenIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No courses found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first course to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <div
              key={c.id}
              className="group rounded-2xl border bg-card p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(15,23,42,0.18)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.08),0_20px_40px_-14px_rgba(15,23,42,0.25)] hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${i * 40}ms`, animationDuration: "400ms", animationFillMode: "backwards" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="p-2 rounded-xl w-fit transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  style={{ backgroundColor: `${NAVY}1A`, color: NAVY }}
                >
                  <BookOpenIcon className="size-4" />
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setDialog(c)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setToDelete(c)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="min-w-0">
                <span
                  className="text-xs font-[family-name:var(--font-mono)] px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${NAVY}12`, color: NAVY }}
                >
                  {c.code}
                </span>
                <p className="font-medium mt-1.5 truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.groupCount} group{c.groupCount === 1 ? "" : "s"}
                </p>
              </div>

              <p className="text-[11px] text-muted-foreground/80 font-[family-name:var(--font-mono)] border-t pt-2">
                Added {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <CourseFormDialog
          course={dialog === "create" ? null : dialog}
          onClose={() => setDialog(null)}
          onSaved={() => {
            toastSuccess(dialog === "create" ? "Course created" : "Course updated")
            setDialog(null)
            refresh()
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          message={`Delete course "${toDelete.name}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}