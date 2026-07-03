"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  courses: "Courses",
  groups: "Groups",
  zones: "Zones",
  sessions: "Sessions",
  users: "Users",
  reports: "Reports",
  attendance: "Attendance",
  "check-in": "Check In",
  session: "Live Session",
  absent: "Absent List",
  override: "Override",
  me: "My Attendance",
  security: "Security",
  device: "Device",
  face: "Face ID",
  settings: "Settings",
  profile: "Profile",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/")
          const isLast = i === segments.length - 1
          const label = LABELS[seg] ?? seg

          return (
            <span key={href} className="flex items-center gap-1.5">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}