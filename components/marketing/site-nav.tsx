"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { COLOR } from "./theme"

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#map", label: "Network" },
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap');
        :root { --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif; }
      `}</style>

      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pointer-events-none">
        <nav
          className={[
            "pointer-events-auto flex items-center justify-between border backdrop-blur-xl transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
            scrolled
              ? "mt-3 w-[min(94%,780px)] h-14 rounded-full px-3 shadow-md shadow-black/[0.04]"
              : "mt-0 w-full h-16 rounded-none px-6 sm:px-10 border-x-0 border-t-0",
          ].join(" ")}
          style={{ backgroundColor: "rgba(255,255,255,0.85)", borderColor: COLOR.border }}
        >
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="flex aspect-square size-8 items-center justify-center rounded-xl shadow-sm"
              style={{ background: `linear-gradient(155deg, ${COLOR.brandLight}, ${COLOR.brand} 70%)`, color: COLOR.white }}
            >
              <CalendarCheckIcon className="size-4" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg tracking-tight" style={{ color: COLOR.ink }}>
              ICheck
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: COLOR.slate }}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="transition-colors hover:opacity-70">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size={scrolled ? "sm" : "default"} asChild className="hover:bg-black/[0.03]" style={{ color: COLOR.ink }}>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size={scrolled ? "sm" : "default"} asChild style={{ background: `linear-gradient(135deg, ${COLOR.brandLight}, ${COLOR.brand})`, color: COLOR.white }} className="hover:opacity-90">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  )
}