"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ScanFaceIcon, MapPinIcon, SmartphoneIcon, ShieldCheckIcon } from "lucide-react"

const BRAND = "#1C4D8D"
const SPRING = { stiffness: 90, damping: 24, mass: 0.4 }

export function CheckInCard3D({ heroRef }: { heroRef: React.RefObject<HTMLElement | null> }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 })
  const [hovering, setHovering] = useState(false)

  // ── Scroll-driven 3D: as the hero scrolls out of view, the card leans back,
  // shrinks and fades — like it's tipping away into the page. Springs smooth
  // out the raw scroll-linked values so it settles instead of snapping.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })
  const scrollRotateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, -35]), SPRING)
  const scrollScale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 0.82]), SPRING)
  const scrollY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 90]), SPRING)
  const scrollOpacity = useSpring(useTransform(scrollYProgress, [0, 0.8], [1, 0.15]), SPRING)

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({ rx: (0.5 - py) * 18, ry: (px - 0.5) * 24, mx: px * 100, my: py * 100 })
  }

  function reset() {
    setHovering(false)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50 })
  }

  return (
    <motion.div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={reset}
      className="relative mx-auto w-full max-w-sm [perspective:1400px]"
      style={{ y: scrollY, opacity: scrollOpacity }}
      initial={{ opacity: 0, y: 40, rotateX: -20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <FloatingBadge icon={ScanFaceIcon} tilt={tilt} hovering={hovering} style={{ top: "-8%", left: "-12%" }} depth={70} delay="0s" />
      <FloatingBadge icon={MapPinIcon} tilt={tilt} hovering={hovering} style={{ top: "8%", right: "-14%" }} depth={90} delay="0.6s" />
      <FloatingBadge icon={SmartphoneIcon} tilt={tilt} hovering={hovering} style={{ bottom: "-6%", left: "2%" }} depth={55} delay="1.1s" />

      {/* Card plane: pointer-tilt (rotateX/rotateY) composed with scroll-tilt (rotateX/scale) */}
      <motion.div
        className={`relative rounded-2xl border border-border bg-card shadow-xl [transform-style:preserve-3d] transition-transform duration-300 ease-out motion-reduce:transition-none ${!hovering ? "animate-[card-idle_6s_ease-in-out_infinite]" : ""}`}
        style={{
          rotateX: scrollRotateX,
          scale: scrollScale,
          transform: !hovering ? undefined : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            opacity: hovering ? 1 : 0,
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, color-mix(in oklab, ${BRAND} 18%, transparent), transparent 55%)`,
          }}
        />

        <div className="p-6" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground">
              SESSION · CS-204 · ZONE B
            </p>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3" style={{ transform: "translateZ(30px)" }}>
            <div
              className="size-11 rounded-full flex items-center justify-center text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
                OE
            </div>
            <div>
              <p className="font-medium leading-tight">Ong Endy</p>
              <p className="font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground">
                08:59:42 AM
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-5">
            <div className="flex items-center gap-3" style={{ color: BRAND }}>
              <ScanFaceIcon className="size-4" />
              <MapPinIcon className="size-4" />
              <SmartphoneIcon className="size-4" />
            </div>
            <span
              className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-700 dark:text-emerald-400 shadow-sm"
              style={{ transform: "translateZ(45px) rotate(-3deg)" }}
            >
              <ShieldCheckIcon className="size-3.5" /> PRESENT
            </span>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes card-idle {
          0%, 100% { transform: rotateX(4deg) rotateY(-6deg) translateY(0px); }
          50% { transform: rotateX(-2deg) rotateY(4deg) translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[card-idle_6s_ease-in-out_infinite\\] { animation: none; }
        }
      `}</style>
    </motion.div>
  )
}

function FloatingBadge({
  icon: Icon, tilt, hovering, style, depth, delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  tilt: { rx: number; ry: number }
  hovering: boolean
  style: React.CSSProperties
  depth: number
  delay: string
}) {
  const driftX = hovering ? tilt.ry * -1.4 : 0
  const driftY = hovering ? tilt.rx * 1.4 : 0

  return (
    <div
      className={`absolute z-10 hidden sm:flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-md transition-transform duration-300 ease-out motion-reduce:animate-none ${!hovering ? "animate-[badge-float_5s_ease-in-out_infinite]" : ""}`}
      style={{
        ...style,
        color: BRAND,
        animationDelay: delay,
        transform: `translate3d(${driftX}px, ${driftY}px, ${depth}px)`,
      }}
    >
      <Icon className="size-5" />
      <style>{`
        @keyframes badge-float {
          0%, 100% { transform: translate3d(0, 0px, ${depth}px); }
          50% { transform: translate3d(0, -8px, ${depth}px); }
        }
      `}</style>
    </div>
  )
}