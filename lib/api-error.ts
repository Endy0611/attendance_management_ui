/**
 * lib/api-error.ts
 *
 * ApiError carries the real HTTP status + backend message so service files
 * can log the technical detail (server-side console.error — visible in your
 * `npm run dev` terminal, never sent to the browser), while every action
 * file shows the person a plain-language message via toFriendlyMessage().
 *
 * Rule of thumb baked into the mapping below:
 *   400 / 404 / 409  → backend message IS meant for the user
 *                      (e.g. "Current password is incorrect", "Email already
 *                      registered") — these come from your validation /
 *                      business-rule layer, so we show them as-is.
 *   401 / 403 / 5xx / network failure → backend message is NOT meant for the
 *                      user (stack traces, "Something went wrong", etc.) —
 *                      we replace it with a friendly, generic sentence.
 */

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const FALLBACK = "Something went wrong. Please try again.";

/**
 * Converts any caught error into a message safe to show in a toast or
 * inline form error. Use this in every actions/*.action.ts catch block
 * instead of `err instanceof Error ? err.message : "..."`.
 */
export function toFriendlyMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Validation / business-rule errors — the backend wrote these for a
    // human to read, so pass them through.
    if (err.status === 400 || err.status === 404 || err.status === 409) {
      return err.message || FALLBACK;
    }

    if (err.status === 401) {
      return "Your session has expired. Please sign in again.";
    }

    if (err.status === 403) {
      return "You don't have permission to do that.";
    }

    if (err.status === 0) {
      return "Can't reach the server. Check your connection and try again.";
    }

    // 5xx and anything else unexpected
    return "Something went wrong on our end. Please try again in a moment.";
  }

  if (err instanceof Error) {
    // Non-ApiError (e.g. a thrown redirect, unexpected runtime error) —
    // never show the raw .message to the user, it's not written for them.
    return FALLBACK;
  }

  return FALLBACK;
}