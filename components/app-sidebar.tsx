"use client"

import * as React from "react"
import {
  LayoutDashboardIcon, UsersIcon, BookOpenIcon, MapPinIcon, LayersIcon,
  CalendarIcon, ClipboardListIcon, ScanFaceIcon, Settings2Icon,
  GraduationCapIcon, ShieldCheckIcon, DownloadIcon, CalendarOffIcon, CalendarClockIcon,
  ChevronRightIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from "@/components/ui/sheet"
import { useAuthStore } from "@/store/auth.store"
import { cn } from "@/lib/utils"

const PRIMARY = "#1C4D8D"

type SubItem = { title: string; url: string }
type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
  items: SubItem[]
}

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon />, items: [] },
  { title: "Users", url: "/dashboard/users", icon: <UsersIcon />, items: [] },
  { title: "Courses", url: "/dashboard/courses", icon: <BookOpenIcon />, items: [] },
  { title: "Majors", url: "/dashboard/majors", icon: <GraduationCapIcon />, items: [] },
  { title: "Zones", url: "/dashboard/zones", icon: <MapPinIcon />, items: [] },
  { title: "Groups", url: "/dashboard/groups", icon: <LayersIcon />, items: [] },
  { title: "Sessions", url: "/dashboard/sessions", icon: <CalendarIcon />, items: [] },
  { title: "Holidays", url: "/dashboard/holidays", icon: <CalendarOffIcon />, items: [] },
  { title: "Timetable", url: "/dashboard/timetable", icon: <CalendarClockIcon />, items: [] },
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

const instructorNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboardIcon />, items: [] },
  { title: "My Groups", url: "/dashboard/groups", icon: <LayersIcon />, items: [] },
  { title: "Sessions", url: "/dashboard/sessions", icon: <CalendarIcon />, items: [] },
  { title: "Holidays", url: "/dashboard/holidays", icon: <CalendarOffIcon />, items: [] },
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

const studentNav: NavItem[] = [
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

const navByRole: Record<string, NavItem[]> = {
  ADMIN:      adminNav,
  INSTRUCTOR: instructorNav,
  STUDENT:    studentNav,
}

const roleMeta: Record<string, { label: string }> = {
  ADMIN:      { label: "Admin" },
  INSTRUCTOR: { label: "Instructor" },
  STUDENT:    { label: "Student" },
}

const mobileNavByRole: Record<string, NavItem[]> = {
  ADMIN: [
    adminNav[0],
    adminNav[1],
    adminNav.find(i => i.title === "Attendance")!,
    adminNav.find(i => i.title === "Reports")!,
    adminNav.find(i => i.title === "Settings")!,
  ],
  INSTRUCTOR: [
    instructorNav[0],
    instructorNav[1],
    instructorNav.find(i => i.title === "Attendance")!,
    instructorNav.find(i => i.title === "Reports")!,
    instructorNav.find(i => i.title === "Settings")!,
  ],
  STUDENT: [
    studentNav[0],
    studentNav[1],
    studentNav.find(i => i.title === "Attendance")!,
    studentNav.find(i => i.title === "Face & Device")!,
    studentNav.find(i => i.title === "Settings")!,
  ],
}

// Finds the single longest matching url across every item + sub-item for
// the current pathname, so a parent route ("/dashboard") never lights up
// just because the real match ("/dashboard/users") happens to nest under it.
function findActiveUrl(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null
  for (const item of items) {
    const candidates = [item.url, ...item.items.map((s) => s.url)]
    for (const url of candidates) {
      const matches = pathname === url || pathname.startsWith(url + "/")
      if (matches && (best === null || url.length > best.length)) {
        best = url
      }
    }
  }
  return best
}

function itemContainsUrl(item: NavItem, url: string | null) {
  if (!url) return false
  return item.url === url || item.items.some((s) => s.url === url)
}

function MobileNavButton({ item, active }: { item: NavItem; active: boolean }) {
  const content = (
    <>
      <span
        className="relative flex items-center justify-center size-9 transition-transform duration-300 ease-out [&_svg]:size-[19px]"
        style={{ color: active ? PRIMARY : "var(--muted-foreground)" }}
      >
        {item.icon}
      </span>
      <span
        className="truncate max-w-[62px] text-[10.5px] font-medium leading-none transition-colors duration-300"
        style={{ color: active ? PRIMARY : "var(--muted-foreground)" }}
      >
        {item.title}
      </span>
    </>
  )

  const wrapperClass =
    "relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 active:scale-[0.94] transition-transform duration-150"

  if (item.items.length === 0) {
    return (
      <Link href={item.url} className={wrapperClass}>
        {content}
      </Link>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className={wrapperClass}>
          {content}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[70vh] gap-0 p-0 pb-[env(safe-area-inset-bottom)] rounded-t-3xl"
      >
        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <SheetTitle className="text-base">{item.title}</SheetTitle>
        </SheetHeader>
        <div className="px-2 pb-3">
          {item.items.map((sub, i) => (
            <SheetClose asChild key={sub.url}>
              <Link
                href={sub.url}
                className={cn(
                  "flex items-center justify-between gap-3 px-3.5 py-3.5 text-sm font-medium transition-colors hover:bg-muted",
                  i !== item.items.length - 1 && "border-b border-border/60"
                )}
              >
                <span>{sub.title}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
              </Link>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  const activeUrl = findActiveUrl(pathname, items)

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex md:hidden",
        "h-[58px] items-stretch border-t bg-background/95 backdrop-blur",
        "supports-[backdrop-filter]:bg-background/80",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      {items.map((item) => (
        <MobileNavButton key={item.url} item={item} active={itemContainsUrl(item, activeUrl)} />
      ))}
    </nav>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const loading = !hasHydrated

  if (loading) {
    return (
      <Sidebar collapsible="icon" className="hidden md:flex" {...props}>
        <div className="flex items-center justify-center h-20 p-4 text-xs text-muted-foreground animate-pulse">
          Validating session...
        </div>
      </Sidebar>
    )
  }

  const role = (user?.role ?? "STUDENT").toUpperCase() as keyof typeof navByRole
  const nav = navByRole[role] ?? studentNav
  const mobileNav = mobileNavByRole[role] ?? mobileNavByRole.STUDENT
  const meta = roleMeta[role] ?? roleMeta.STUDENT

  return (
    <>
      <Sidebar collapsible="icon" className="hidden md:flex" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <div
                    className="flex aspect-square size-8 items-center justify-center rounded-xl text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY}CC)` }}
                  >
                    <GraduationCapIcon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold text-sm">ICheck</span>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-1.5 py-0.5 w-fit -ml-1.5"
                      style={{ color: PRIMARY, backgroundColor: `${PRIMARY}12` }}
                    >
                      <ShieldCheckIcon className="size-3" />
                      {meta.label}
                    </span>
                  </div>
                </Link>
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
              avatar: user?.avatar || undefined,
            }}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <MobileBottomNav items={mobileNav} />
    </>
  )
}