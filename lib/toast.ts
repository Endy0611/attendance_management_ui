/**
 * lib/toast.ts
 *
 * Thin wrapper around sileo so every component fires toasts the same way
 * instead of each manager rolling its own `useState<string>` + `setTimeout`
 * banner (which is what course/group/major/zone/session/user managers were
 * doing before this). Mount <Toaster /> once in app/layout.tsx; call these
 * helpers from anywhere — client components only (sileo is client-side).
 */

import { sileo } from "sileo"

export function toastSuccess(message: string, description?: string) {
  sileo.success({ title: message, description })
}

export function toastError(message: string, description?: string) {
  sileo.error({ title: message, description })
}

export function toastInfo(message: string, description?: string) {
  sileo.info({ title: message, description })
}

export function toastWarning(message: string, description?: string) {
  sileo.warning({ title: message, description })
}

/**
 * Generic promise-based toast — for any real Promise that actually rejects
 * on failure (e.g. a raw fetch, a service.ts call that throws). NOT for
 * Server Actions in this project, since those resolve to ActionResult and
 * never reject — use notifyPromiseResult below for those instead.
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((err: unknown) => string)
  }
) {
  return sileo.promise(promise, {
    loading: { title: messages.loading },
    success: (data: T) => ({
      title:
        typeof messages.success === "function"
          ? messages.success(data)
          : messages.success,
    }),
    error: (err: unknown) => ({
      title:
        typeof messages.error === "function"
          ? messages.error(err)
          : messages.error,
    }),
  })
}

/**
 * For an ActionResult<T> = { ok: true, data: T } | { ok: false, error: string }
 * — the shape every action.ts file in this project returns. These never
 * reject, so a plain sileo.promise() would show "success" even on a real
 * failure. This awaits the action, inspects .ok, and fires the correct
 * toast — while still giving you the loading state in between.
 *
 * Usage:
 *   const result = await notifyPromiseResult(
 *     updateProfileServerAction(formData),
 *     { loading: "Saving changes...", success: "Profile updated" }
 *   )
 *   if (!result.ok) return
 *   setUser(result.data)
 */
export async function notifyPromiseResult<T>(
  actionPromise: Promise<{ ok: true; data: T } | { ok: false; error: string }>,
  messages: { loading: string; success: string }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const loadingId = sileo.info({ title: messages.loading, duration: null })

  const result = await actionPromise

  sileo.dismiss(loadingId)

  if (result.ok) {
    toastSuccess(messages.success)
  } else {
    toastError(result.error)
  }

  return result
}

/**
 * For an ActionResult<T> = { ok: true, data: T } | { ok: false, error: string }
 * — the shape every action.ts file in this project returns. Fires the right
 * toast and returns whether it succeeded, so callers can do:
 *   if (!notifyResult(result, "Course created")) return
 */
export function notifyResult<T>(
  result: { ok: true; data: T } | { ok: false; error: string },
  successMessage: string
): result is { ok: true; data: T } {
  if (result.ok) {
    toastSuccess(successMessage)
    return true
  }
  toastError(result.error)
  return false
}