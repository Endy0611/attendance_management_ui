"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { COLOR } from "@/components/marketing/theme"

export function CtaBand() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20 px-6 sm:px-10" style={{ backgroundColor: COLOR.paper }}>
      <div className="relative max-w-6xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-10 sm:px-12 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ background: `linear-gradient(135deg, ${COLOR.brandDeep}, ${COLOR.brand})` }}
        >
          <motion.div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.18)" }} animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.10)" }} animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.5, 0.25] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />

          <div className="relative">
            <h2 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-balance" style={{ color: COLOR.white }}>
              Ready to stop guessing who showed up?
            </h2>
            <p className="mt-2 max-w-md" style={{ color: "rgba(255,255,255,0.75)" }}>
              Set up your first course in a few minutes — no credit card, just a university email.
            </p>
          </div>
          <Button size="lg" asChild style={{ backgroundColor: COLOR.white, color: COLOR.brandDeep }} className="relative hover:opacity-90 hover:scale-105 transition-transform shrink-0">
            <Link href="/register">
              Create account <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}