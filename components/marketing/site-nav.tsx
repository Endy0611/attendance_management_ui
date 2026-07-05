"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"

const BRAND = "#1C4D8D"

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
      <nav
        className={[
          "pointer-events-auto flex items-center justify-between transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          "bg-background/75 backdrop-blur-xl border border-border/60",
          scrolled
            ? "mt-3 w-[min(94%,760px)] h-14 rounded-full px-3 shadow-lg shadow-black/5"
            : "mt-0 w-full h-16 rounded-none px-6 sm:px-10 border-x-0 border-t-0 shadow-none",
        ].join(" ")}
      >
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex aspect-square size-8 items-center justify-center rounded-full text-white transition-transform duration-500"
            style={{ backgroundColor: BRAND }}
          >
            <CalendarCheck2Icon className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">ICheck</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="ghost" size={scrolled ? "sm" : "default"} asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            size={scrolled ? "sm" : "default"}
            asChild
            style={{ backgroundColor: BRAND }}
            className="text-white hover:opacity-90"
          >
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </nav>
    </div>
  )
}