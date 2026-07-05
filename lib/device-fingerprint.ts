// lib/device-fingerprint.ts
//
// One formula, used in exactly two places:
//   1. Security → Device page, when the student binds this device
//   2. The check-in flow, on every attendance submission
//
// Both MUST produce the same string for the same physical device, or every
// check-in will fail with a "device mismatch" from the backend even though
// the student is on their bound phone. Don't change this formula without a
// migration plan for already-bound fingerprints.
export function generateDeviceFingerprint(): string {
  const nav = navigator
  const parts = [
    nav.userAgent,
    nav.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency ?? "?",
  ]
  let hash = 0
  const str = parts.join("|")
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, "0")
}
