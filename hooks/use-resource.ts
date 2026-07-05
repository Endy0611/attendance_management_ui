/**
 * hooks/use-resource.ts
 *
 * One SWR wrapper used by every manager component (courses, groups, majors,
 * zones, sessions, users, ...) instead of each one hand-rolling its own
 * `useState(initial) + useTransition + refresh()` combo.
 *
 * Why this fixes the "refresh reloads the whole page" complaint:
 * - `fallbackData` is the data the server component already fetched via the
 *   matching *Action() (server action) at request time — so there's no
 *   loading flash on first paint, same as before.
 * - Calling the returned `refresh()` (an alias for SWR's `mutate()`) after a
 *   create/update/delete revalidates in the background. `isValidating` flips
 *   true/false around that call so the manager can show a small inline
 *   skeleton over just the list/table it owns — not a full page reload, and
 *   not even a full unmount, since the previous data stays on screen the
 *   whole time (`keepPreviousData`).
 * - `revalidateOnFocus` means switching back to the tab after someone else
 *   changed something (e.g. another admin) quietly re-syncs without the
 *   student/instructor having to hit refresh.
 *
 * Usage:
 *   const { data: courses, isValidating, refresh } = useResource(
 *     "courses",
 *     async () => {
 *       const result = await getCoursesAction()
 *       if (!result.ok) throw new Error(result.error)
 *       return result.data
 *     },
 *     initialCourses
 *   )
 */

import useSWR from "swr"

export function useResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  fallbackData?: T
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(key, fetcher, {
    fallbackData,
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  return {
    data: (data ?? fallbackData) as T,
    error,
    isLoading,
    isValidating,
    refresh: mutate,
  }
}