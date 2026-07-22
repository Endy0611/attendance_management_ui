"use client"

import { useEffect, useRef, useState } from "react"
import { useInView, animate } from "framer-motion"
import { COLOR } from "./theme"

const STATS = [
  { to: 12000, suffix: "+", label: "check-ins verified" },
  { to: 99.4, decimals: 1, suffix: "%", label: "face-match accuracy" },
  { to: 40, suffix: " univ.", label: "campuses onboard" },
  { to: 2, prefix: "< ", suffix: "s", label: "average check-in time" },
]

function Counter({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setDisplay(v.toFixed(decimals)) })
    return () => controls.stop()
  }, [inView, to, decimals])

  return <span ref={ref}>{prefix}{display}{suffix}</span>
}

export function StatsBand() {
  return (
    <section className="py-16 sm:py-20 border-y" style={{ backgroundColor: COLOR.paperAlt, borderColor: COLOR.border }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <div key={i} className="text-center sm:text-left" style={i > 0 ? { borderLeft: `1px dashed ${COLOR.border}`, paddingLeft: "1.5rem" } : undefined}>
            <p className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl" style={{ color: COLOR.brand }}>
              <Counter to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
            </p>
            <p className="mt-1.5 text-xs sm:text-sm" style={{ color: COLOR.slate }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}