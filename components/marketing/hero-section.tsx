"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckInCard3D } from "@/components/marketing/checkin-card-3d"

const BRAND = "#1C4D8D"

const STATS = [
  { value: "< 2s", label: "average check-in time" },
  { value: "1", label: "device per student, enforced" },
  { value: "3", label: "roles — student, instructor, admin" },
]

// Smoothing preset shared by every scroll-linked value on this page —
// keeps the motion physically damped instead of snapping 1:1 to scroll delta.
const SPRING = { stiffness: 90, damping: 24, mass: 0.4 }

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const copyY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -60]), SPRING)
  const copyOpacity = useSpring(useTransform(scrollYProgress, [0, 0.7], [1, 0.2]), SPRING)
  const blobY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 140]), SPRING)

  return (
    <section ref={heroRef} className="relative overflow-hidden pt-16">
      {/* Ambient brand-color blobs, drifting slower than the content on scroll */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 size-[32rem] rounded-full blur-3xl opacity-20 dark:opacity-25"
        style={{ background: BRAND, y: blobY }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-20 -right-32 size-[26rem] rounded-full blur-3xl opacity-[0.12] dark:opacity-20"
        style={{ background: "#2F9E6E", y: blobY }}
      />

      <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-16 sm:pt-24 grid gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div style={{ y: copyY, opacity: copyOpacity }}>
          <p
            className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase mb-5"
            style={{ color: BRAND }}
          >
            Smart campus attendance
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08] text-balance">
            Check in in seconds.
            <br />
            No more{" "}
            <span style={{ color: BRAND }}>faked roll calls</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md text-pretty">
            ICheck confirms you&apos;re really there before a session counts you present —
            your face, your location, and your device all have to agree. Built for
            universities that are tired of attendance sheets nobody can trust.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild style={{ backgroundColor: BRAND }} className="text-white hover:opacity-90">
              <Link href="/register">
                Create account <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 max-w-md border-t border-border pt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight" style={{ color: BRAND }}>
                  {s.value}
                </dd>
                <p className="mt-1 text-xs text-muted-foreground leading-snug">{s.label}</p>
              </div>
            ))}
          </dl>
        </motion.div>

        <div className="relative">
          {/* Slow continuous rotation — a dashed ring "orbiting" behind the card */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -m-10 sm:-m-16 flex items-center justify-center motion-reduce:hidden"
          >
            <div
              className="size-[26rem] rounded-full border border-dashed animate-[spin_28s_linear_infinite]"
              style={{ borderColor: `${BRAND}33` }}
            />
            <div
              className="absolute size-[20rem] rounded-full border border-dashed animate-[spin-reverse_20s_linear_infinite]"
              style={{ borderColor: "#2F9E6E40" }}
            />
          </div>

          <CheckInCard3D heroRef={heroRef} />
        </div>
      </div>

      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </section>
  )
}