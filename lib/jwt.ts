export interface AccessTokenClaims {
  userId: string
  Name: string
  username: string
  roles: string[]
  sub: string
  iat: number
  exp: number
}

export function decodeToken(token: string): AccessTokenClaims | null {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json) as AccessTokenClaims
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeToken(token)
  if (!claims?.exp) return true
  return claims.exp * 1000 < Date.now()
}

export function getRoleFromToken(token: string): "ADMIN" | "INSTRUCTOR" | "STUDENT" | null {
  const claims = decodeToken(token)
  const role = claims?.roles?.[0]
  if (role === "ADMIN" || role === "INSTRUCTOR" || role === "STUDENT") return role
  return null
}