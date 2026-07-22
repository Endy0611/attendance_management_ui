"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckInCard3D } from "@/components/marketing/checkin-card-3d"
import { COLOR } from "@/components/marketing/theme"

const STATS = [
  { value: "< 2s", label: "average check-in time" },
  { value: "1", label: "device per student, enforced" },
  { value: "3", label: "signals checked at once" },
]

const SPRING = { stiffness: 90, damping: 24, mass: 0.4 }

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const copyY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -60]), SPRING)
  const copyOpacity = useSpring(useTransform(scrollYProgress, [0, 0.7], [1, 0.25]), SPRING)
  const sealY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 40]), SPRING)
  const sealOpacity = useSpring(useTransform(scrollYProgress, [0, 0.8], [1, 0.2]), SPRING)

  return (
    <section ref={heroRef} className="relative overflow-hidden pt-16" style={{ backgroundColor: COLOR.paper }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: `radial-gradient(${COLOR.border} 1px, transparent 1px)`, backgroundSize: "26px 26px" }} />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 size-[38rem] rounded-full blur-3xl opacity-[0.10]" style={{ background: COLOR.brand }} />
      <div aria-hidden className="pointer-events-none absolute -top-20 right-0 size-[26rem] rounded-full blur-3xl opacity-[0.08]" style={{ background: COLOR.brandLight }} />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-20 sm:pt-24 grid gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-5" style={{ borderColor: COLOR.border, backgroundColor: COLOR.white }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: COLOR.brand }} />
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.25em] uppercase" style={{ color: COLOR.brand }}>
              Attendance, verified
            </p>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl leading-[1.05] text-balance" style={{ color: COLOR.ink }}>
            Present isn&apos;t a guess.
            <br />
            It&apos;s a <span style={{ color: COLOR.brand }}>seal</span>.
          </h1>
          <p className="mt-6 text-lg max-w-md text-pretty" style={{ color: COLOR.slate }}>
            ICheck confirms you&apos;re really there before a session counts you present —
            face, location, and device all have to agree. Built for universities
            tired of attendance sheets nobody can trust.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild style={{ background: `linear-gradient(135deg, ${COLOR.brandLight}, ${COLOR.brand})`, color: COLOR.white }} className="hover:opacity-90 hover:scale-[1.02] transition-transform">
              <Link href="/register">
                Create account <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild style={{ borderColor: COLOR.border, color: COLOR.ink, backgroundColor: COLOR.white }} className="hover:bg-black/[0.02]">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <dl className="mt-12 flex max-w-md border-t pt-6" style={{ borderColor: COLOR.border }}>
            {STATS.map((s, i) => (
              <div key={s.label} className="flex-1 px-4 first:pl-0" style={i > 0 ? { borderLeft: `1px dashed ${COLOR.border}` } : undefined}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl" style={{ color: COLOR.ink }}>{s.value}</dd>
                <p className="mt-1 text-xs leading-snug" style={{ color: COLOR.slate }}>{s.label}</p>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div style={{ y: sealY, opacity: sealOpacity }}>
          <CheckInCard3D />
        </motion.div>
      </div>
    </section>
  )
}