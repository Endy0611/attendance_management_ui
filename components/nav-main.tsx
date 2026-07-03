"use client"

import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

// ── Active-state model ──────────────────────────────────────────────────
// "Sticky" = driven by the current URL (usePathname), not by click-state we
// track ourselves. Navigating to a page *is* the click — the browser's own
// history makes it durable across renders, so there's nothing to reset when
// you move the mouse away. Hover is a separate, purely visual, non-sticky
// tint layered on top so you get a live preview without disturbing which
// item is actually active.
//
// Color language: solid navy (#1C4D8D, the project's established accent —
// see CLAUDE.md §3) marks the active item. A soft blue tint (sky-500/10)
// previews on hover for every *other* item. Only one item is ever solid at
// a time; hovering a second item never removes the solid state from the
// first, since that state comes from the route, not from hover.

const ACCENT = "#1C4D8D"

function isExactActive(pathname: string, url: string) {
  return pathname === url
}

function isSectionActive(pathname: string, url: string, subItems?: { url: string }[]) {
  if (subItems && subItems.length > 0) {
    return subItems.some((s) => pathname === s.url || pathname.startsWith(s.url + "/"))
  }
  return pathname === url || pathname.startsWith(url + "/")
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items && item.items.length > 0
          const sectionActive = isSectionActive(pathname, item.url, item.items)
          const topActive = !hasChildren && isExactActive(pathname, item.url)

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={sectionActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  {hasChildren ? (
                    <SidebarMenuButton
                      tooltip={item.title}
                      data-active={sectionActive}
                      className="transition-colors duration-150 data-[active=true]:text-[#1C4D8D] data-[active=true]:bg-[#1C4D8D]/10 data-[active=true]:font-medium hover:bg-sky-500/10 hover:text-[#1C4D8D]"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      data-active={topActive}
                      className="transition-colors duration-150 data-[active=true]:text-white data-[active=true]:font-medium hover:bg-sky-500/10 hover:text-[#1C4D8D] data-[active=true]:hover:text-white"
                      style={topActive ? { backgroundColor: ACCENT } : undefined}
                    >
                      <a href={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  )}
                </CollapsibleTrigger>
                {hasChildren && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => {
                        const subActive = isExactActive(pathname, subItem.url)
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              data-active={subActive}
                              className="transition-colors duration-150 border-l-2 border-transparent data-[active=true]:border-[#1C4D8D] data-[active=true]:text-[#1C4D8D] data-[active=true]:bg-[#1C4D8D]/10 data-[active=true]:font-medium hover:bg-sky-500/10 hover:text-[#1C4D8D]"
                            >
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
