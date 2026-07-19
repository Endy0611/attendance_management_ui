const KEY = "pendingVerificationEmail";

export function setPendingVerification(email: string) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, email);
}

export function getPendingVerification(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function clearPendingVerification() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}