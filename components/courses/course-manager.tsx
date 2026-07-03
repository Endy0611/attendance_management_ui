"use client"

import { useState, useTransition } from "react"
import { getCoursesAction, deleteCourseAction } from "@/actions/course.action"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import type { CourseResponse } from "@/types/course-types"
import { PlusIcon, PencilIcon, TrashIcon, LoaderIcon, SearchIcon, BookOpenIcon } from "lucide-react"

export function CourseManager({ initialCourses }: { initialCourses: CourseResponse[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<CourseResponse | "create" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState("")
  const [isRefreshing, startRefresh] = useTransition()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function refresh() {
    startRefresh(async () => {
      const result = await getCoursesAction()
      if (result.ok) setCourses(result.data)
    })
  }

  async function handleDelete(course: CourseResponse) {
    if (!confirm(`Delete course "${course.name}"? This cannot be undone.`)) return
    setDeletingId(course.id)
    const result = await deleteCourseAction(course.id)
    setDeletingId(null)

    if (!result.ok) {
      showToast(result.error)
      return
    }
    showToast("Course deleted")
    refresh()
  }

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
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
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: "#1C4D8D" }}
        >
          <PlusIcon className="size-4" />
          New Course
        </button>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
          placeholder="Search by name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isRefreshing && filtered.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-12 text-center">
          <div className="p-3 rounded-xl bg-[#1C4D8D]/10 text-[#1C4D8D]">
            <BookOpenIcon className="size-5" />
          </div>
          <p className="font-medium text-sm">No courses found</p>
          <p className="text-xs text-muted-foreground">
            {search ? "Try a different search term." : "Create your first course to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-[family-name:var(--font-mono)] bg-[#1C4D8D]/10 text-[#1C4D8D] px-2 py-0.5 rounded-md">
                    {c.code}
                  </span>
                  <p className="font-medium mt-1.5 truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.groupCount} group{c.groupCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setDialog(c)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
                  >
                    {deletingId === c.id ? (
                      <LoaderIcon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-[family-name:var(--font-mono)]">
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
            showToast(dialog === "create" ? "Course created" : "Course updated")
            setDialog(null)
            refresh()
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-foreground text-background text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}