/**
 * lib/api-error.ts
 *
 * ApiError carries the HTTP status alongside the message, so callers can
 * branch on "was this a 401 I can retry after refreshing the token?" instead
 * of string-matching error messages.
 *
 * toFriendlyMessage() is the single place that turns any thrown error into
 * copy a user should actually see — never a raw stack trace or "fetch failed".
 */

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function toFriendlyMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return err.message || "That didn't look right — please check the form.";
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return "We couldn't find what you were looking for.";
      case 409:
        return err.message || "That already exists.";
      case 422:
        return err.message || "That didn't look right — please check the form.";
      case 429:
        return "Too many attempts — please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return "Something went wrong on our end. Please try again.";
      default:
        return err.message || "Something went wrong.";
    }
  }

  // fetch() itself throws a bare TypeError when there's no network at all
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Can't reach the server. Check your connection and try again.";
  }

  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}