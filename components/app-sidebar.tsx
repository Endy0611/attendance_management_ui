"use client"

import * as React from "react"
import {
  LayoutDashboardIcon, UsersIcon, BookOpenIcon, MapPinIcon, LayersIcon,
  CalendarIcon, ClipboardListIcon, ScanFaceIcon, Settings2Icon,
  GraduationCapIcon, ShieldCheckIcon, DownloadIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/auth.store"

const adminNav = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon />, items: [] },
  { title: "Users", url: "/dashboard/users", icon: <UsersIcon />, items: [] },
  { title: "Courses", url: "/dashboard/courses", icon: <BookOpenIcon />, items: [] },
  { title: "Zones", url: "/dashboard/zones", icon: <MapPinIcon />, items: [] },
  { title: "Groups", url: "/dashboard/groups", icon: <LayersIcon />, items: [] },
  { title: "Sessions", url: "/dashboard/sessions", icon: <CalendarIcon />, items: [] },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: <ClipboardListIcon />,
    items: [
      { title: "By Session",  url: "/dashboard/attendance/session" },
      { title: "Absent List", url: "/dashboard/attendance/absent" },
      { title: "Override",    url: "/dashboard/attendance/override" },
    ],
  },
  { title: "Reports", url: "/dashboard/reports", icon: <DownloadIcon />, items: [] },
  { title: "Settings", url: "/dashboard/settings", icon: <Settings2Icon />, items: [{ title: "Profile", url: "/dashboard/settings/profile" }] },
]

const instructorNav = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon />, items: [] },
  { title: "My Groups", url: "/dashboard/groups", icon: <LayersIcon />, items: [] },
  { title: "Sessions", url: "/dashboard/sessions", icon: <CalendarIcon />, items: [] },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: <ClipboardListIcon />,
    items: [
      { title: "By Session",  url: "/dashboard/attendance/session" },
      { title: "Absent List", url: "/dashboard/attendance/absent" },
      { title: "Override",    url: "/dashboard/attendance/override" },
    ],
  },
  { title: "Reports", url: "/dashboard/reports", icon: <DownloadIcon />, items: [] },
  { title: "Settings", url: "/dashboard/settings", icon: <Settings2Icon />, items: [{ title: "Profile", url: "/dashboard/settings/profile" }] },
]

const studentNav = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon />, items: [] },
  { title: "My Groups", url: "/dashboard/groups", icon: <LayersIcon />, items: [] },
  {
    title: "Attendance",
    url: "/dashboard/attendance",
    icon: <ClipboardListIcon />,
    items: [
      { title: "Check In",   url: "/dashboard/attendance/check-in" },
      { title: "My Records", url: "/dashboard/attendance/me" },
    ],
  },
  {
    title: "Face & Device",
    url: "/dashboard/security",
    icon: <ScanFaceIcon />,
    items: [
      { title: "Register Face", url: "/dashboard/security/face" },
      { title: "Bound Device",  url: "/dashboard/security/device" },
    ],
  },
  { title: "Settings", url: "/dashboard/settings", icon: <Settings2Icon />, items: [{ title: "Profile", url: "/dashboard/settings/profile" }] },
]

const navByRole: Record<string, typeof adminNav> = {
  ADMIN:      adminNav,
  INSTRUCTOR: instructorNav,
  STUDENT:    studentNav,
}

const roleMeta: Record<string, { label: string; color: string }> = {
  ADMIN:      { label: "Admin",      color: "text-rose-500" },
  INSTRUCTOR: { label: "Instructor", color: "text-amber-500" },
  STUDENT:    { label: "Student",    color: "text-sky-500" },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const loading = !hasHydrated

  if (loading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <div className="flex items-center justify-center h-20 p-4 text-xs text-muted-foreground animate-pulse">
          Validating session...
        </div>
      </Sidebar>
    )
  }

  // Fallback cleanly to student layout instead of breaking if auth failed
  const role = (user?.role ?? "STUDENT").toUpperCase() as keyof typeof navByRole
  const nav = navByRole[role] ?? studentNav
  const meta = roleMeta[role] ?? roleMeta.STUDENT

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCapIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">ICheck</span>
                  <span className={`text-xs font-medium ${meta.color}`}>
                    <ShieldCheckIcon className="inline size-3 mr-0.5 -mt-0.5" />
                    {meta.label}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={nav} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name:   user?.name  ?? "Guest User",
            email:  user?.email ?? "no-session",
            avatar: user?.avatar ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}