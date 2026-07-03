"use client"

import { createContext, useContext, useEffect, useState } from "react"

export interface AuthUser {
  id:           string
  name:         string
  email:        string
  phone:        string | null
  studentId:    string | null
  generation:   number | null
  role:         "ADMIN" | "INSTRUCTOR" | "STUDENT"
  avatar:       string | null
  verified:     boolean
  active:       boolean
  deviceBound:  boolean
  firstLogin:   boolean
  createdAt:    string
}

interface AuthContextValue {
  user:    AuthUser | null
  loading: boolean
  refetch: () => Promise<void>
  logout:  () => void
}

const AuthContext = createContext<AuthContextValue>({
  user:    null,
  loading: true,
  refetch: async () => {},
  logout:  () => {},
})

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const token = getCookie("accessToken") || localStorage.getItem("accessToken")
      
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auths/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        setUser(null)
        setLoading(false)
        return
      }

      const data = await res.json()
      setUser(data.payload ?? null)
    } catch (err) {
      console.error("Auth initialization failed:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    localStorage.removeItem("accessToken")
    setUser(null)
    window.location.href = "/login"
  }

  useEffect(() => {
    fetchMe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refetch: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}