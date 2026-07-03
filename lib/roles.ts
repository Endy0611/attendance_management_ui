export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT"

interface RoleCheckable {
  role?: Role | null
}

export function hasRole<T extends RoleCheckable>(user: T | null | undefined, ...allowed: Role[]): boolean {
 if (!user || !user.role) return false
  return allowed.includes(user.role)
}

export function isAdmin<T extends RoleCheckable>(user: T | null | undefined): boolean {
  return hasRole(user, "ADMIN")
}

export function isInstructor<T extends RoleCheckable>(user: T | null | undefined): boolean {
  return hasRole(user, "INSTRUCTOR")
}

export function isStudent<T extends RoleCheckable>(user: T | null | undefined): boolean {
  return hasRole(user, "STUDENT")
}

// Route-level policy shared by proxy.ts (edge, JWT-based) and RoleGuard (client, user-object-based).
// Keep prefixes ordered most-specific first — proxy.ts matches top to bottom.
export const ROUTE_POLICY: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard/users", roles: ["ADMIN"] },
  { prefix: "/dashboard/reports", roles: ["ADMIN", "INSTRUCTOR"] },
  { prefix: "/dashboard/zones", roles: ["ADMIN"] },
  { prefix: "/dashboard/courses", roles: ["ADMIN"] },
  { prefix: "/dashboard/attendance/override", roles: ["ADMIN", "INSTRUCTOR"] },
  { prefix: "/dashboard/attendance/absent", roles: ["ADMIN", "INSTRUCTOR"] },
  { prefix: "/dashboard/attendance/session", roles: ["ADMIN", "INSTRUCTOR"] },
  { prefix: "/dashboard/attendance/check-in", roles: ["STUDENT"] },
  { prefix: "/dashboard/attendance/me", roles: ["STUDENT"] },
  // Groups: ADMIN sees all groups, INSTRUCTOR sees their own, STUDENT sees
  // groups they're enrolled in — GET /groups/me (groupService.mine) already
  // supports all three roles on the backend. STUDENT was missing here even
  // though the student sidebar links to this exact page — fixed.
  { prefix: "/dashboard/groups", roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { prefix: "/dashboard/sessions", roles: ["ADMIN", "INSTRUCTOR"] },
  { prefix: "/dashboard/security/face", roles: ["STUDENT"] },
  // Device binding is a personal-security page like face registration —
  // give it the same STUDENT-only restriction instead of leaving it open
  // to every role by omission.
  { prefix: "/dashboard/security/device", roles: ["STUDENT"] },
]

export function policyFor(pathname: string) {
  return ROUTE_POLICY.find((p) => pathname.startsWith(p.prefix)) ?? null
}