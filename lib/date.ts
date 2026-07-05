/**
 * lib/date.ts
 *
 * Every page was formatting dates its own way — `toLocaleDateString()` here,
 * `toLocaleTimeString([], {...})` there, `toLocaleString()` somewhere else —
 * which is exactly why times looked "inconsistent" across the app: same
 * timestamp, different shape depending on which page rendered it, and a
 * different wall-clock reading depending on the viewer's own device/browser
 * timezone since none of those calls pinned a timezone.
 *
 * The backend (Spring Boot, ZoneId.of("Asia/Phnom_Penh")) always means
 * Cambodia local time when it sends a timestamp, even though the JSON has no
 * offset on it. Pinning `timeZone: "Asia/Phnom_Penh"` here means every page
 * shows the exact same value for the exact same timestamp, regardless of
 * where the browser viewing it happens to be.
 */

const TZ = "Asia/Phnom_Penh"

function toDate(input: string | number | Date): Date {
  return input instanceof Date ? input : new Date(input)
}

/** e.g. "Jul 5, 2026" */
export function formatDate(input: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(toDate(input))
}

/** e.g. "2:30 PM" */
export function formatTime(input: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(input))
}

/** e.g. "Jul 5, 2026, 2:30 PM" */
export function formatDateTime(input: string | number | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(input))
}

/** e.g. "2:30 PM – 4:00 PM" for a session's start/end range */
export function formatTimeRange(start: string | number | Date, end: string | number | Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/** e.g. "3 minutes ago" / "in 2 hours" — relative to now, no timezone math needed */
export function formatRelative(input: string | number | Date): string {
  const date = toDate(input)
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const abs = Math.abs(diffSec)

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (abs < 60) return rtf.format(diffSec, "second")
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour")
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day")
  return formatDate(input)
}