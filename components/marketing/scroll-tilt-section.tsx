"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

const SPRING = { stiffness: 60, damping: 20, mass: 0.5 }

export function ScrollTiltSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })

  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -8]), SPRING)
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.96]), SPRING)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.4, 1, 1, 0.5]), SPRING)

  return (
    <div ref={ref} style={{ perspective: 1600 }} className={className}>
      <motion.div style={{ rotateX, scale, opacity, transformOrigin: "center top" }}>
        {children}
      </motion.div>
    </div>
  )
}