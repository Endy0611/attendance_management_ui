"use client"

/**
 * components/notifications/notification-bell.tsx
 *
 * Header bell — badge with unread count, dropdown with the latest
 * notifications, "mark all read". Follows the same
 * service → action → component chain as every other resource; the only
 * difference is it lives in the header instead of a dedicated page, so it
 * fetches its own initial data on mount rather than getting it as a prop
 * from a server-component page (there isn't one for a header widget).
 */

import { useEffect, useState, useTransition } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  getNotificationsAction,
  getUnreadNotificationCountAction,
  markAllNotificationsReadAction,
} from "@/actions/notification.action"
import type { NotificationResponse } from "@/types/notification-types"
import { formatRelative } from "@/lib/date"
import { toastError } from "@/lib/toast"
import {
  BellIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  XCircleIcon,
  HandHelpingIcon,
  PlayCircleIcon,
  StopCircleIcon,
  SmartphoneIcon,
} from "lucide-react"

const ICONS: Record<NotificationResponse["type"], React.ElementType> = {
  CHECK_IN_SUCCESS: CheckCircle2Icon,
  CHECK_IN_FAILED: XCircleIcon,
  CHECK_IN_HELP_REQUESTED: HandHelpingIcon,
  SESSION_STARTING: PlayCircleIcon,
  SESSION_ENDED: StopCircleIcon,
  DEVICE_BOUND: SmartphoneIcon,
}

const ICON_COLOR: Record<NotificationResponse["type"], string> = {
  CHECK_IN_SUCCESS: "text-emerald-600",
  CHECK_IN_FAILED: "text-rose-600",
  CHECK_IN_HELP_REQUESTED: "text-amber-600",
  SESSION_STARTING: "text-sky-600",
  SESSION_ENDED: "text-muted-foreground",
  DEVICE_BOUND: "text-violet-600",
}

const POLL_MS = 30_000

export function NotificationBell() {
  const [items, setItems] = useState<NotificationResponse[]>([])
  const [unread, setUnread] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function loadCount() {
    const result = await getUnreadNotificationCountAction()
    if (result.ok) setUnread(result.data)
  }

  async function loadList() {
    const result = await getNotificationsAction()
    if (result.ok) {
      setItems(result.data)
      setLoaded(true)
    } else {
      toastError(result.error)
    }
  }

  useEffect(() => {
    loadCount()
    const interval = setInterval(loadCount, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && !loaded) loadList()
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (!result.ok) {
        toastError(result.error)
        return
      }
      setUnread(0)
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="size-4.5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-medium text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm">Notifications</DropdownMenuLabel>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              disabled={isPending}
              onClick={handleMarkAllRead}
            >
              <CheckCheckIcon className="size-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto">
          {!loaded ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] ?? BellIcon
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 text-sm ${
                    n.read ? "" : "bg-muted/50"
                  }`}
                >
                  <Icon className={`size-4 shrink-0 mt-0.5 ${ICON_COLOR[n.type] ?? "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-500" />}
                </div>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}