"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ScanFaceIcon, MapPinIcon, SmartphoneIcon, ShieldCheckIcon, CheckIcon } from "lucide-react"
import { COLOR } from "./theme"

const SIGNALS = [
  { Icon: ScanFaceIcon, label: "Face match" },
  { Icon: MapPinIcon, label: "Inside zone" },
  { Icon: SmartphoneIcon, label: "Bound device" },
]

const CYCLE = 5

// This card is the one deliberately dark, bold surface on an otherwise
// light page — everything around it stays quiet so this reads as the focal
// point rather than the page's default mood.
export function CheckInCard3D() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50 })
  const [hovering, setHovering] = useState(false)
  const [now, setNow] = useState("")

  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("en-US", { hour12: true }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({ rx: (0.5 - py) * 14, ry: (px - 0.5) * 18, mx: px * 100, my: py * 100 })
  }

  function reset() {
    setHovering(false)
    setTilt({ rx: 0, ry: 0, mx: 50, my: 50 })
  }

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full max-w-sm [perspective:1600px]"
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={reset}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 rounded-full blur-2xl opacity-30"
        style={{ background: `conic-gradient(from 0deg, ${COLOR.brand}, ${COLOR.brandLight}, ${COLOR.brand})` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      {SIGNALS.map(({ Icon }, i) => (
        <FloatingBadge key={i} Icon={Icon} index={i} tilt={tilt} hovering={hovering} />
      ))}

      <motion.div
        className="relative rounded-[28px] border shadow-2xl overflow-hidden [transform-style:preserve-3d]"
        style={{
          borderColor: COLOR.line900,
          background: `linear-gradient(155deg, ${COLOR.ink900} 0%, ${COLOR.brandDeep} 55%, ${COLOR.brand} 130%)`,
        }}
        animate={
          !hovering
            ? { rotateX: [3, -2, 3], rotateY: [-4, 3, -4], y: [0, -6, 0] }
            : { rotateX: tilt.rx, rotateY: tilt.ry, y: 0 }
        }
        transition={!hovering ? { duration: 7, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3, ease: "easeOut" }}
      >
        {/* shimmer sweep */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3 opacity-0"
          style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.16), transparent)" }}
          animate={{ x: ["-120%", "220%"], opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: hovering ? 1 : 0,
            background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.14), transparent 55%)`,
          }}
        />

        <div className="relative p-6" style={{ transform: "translateZ(24px)" }}>
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
              SESSION · CS-204 · ZONE B
            </p>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: COLOR.white }} />
              <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: COLOR.white }} />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="size-11 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: `linear-gradient(135deg, ${COLOR.brandLight}, ${COLOR.white})`, color: COLOR.brandDeep }}>
              OE
            </div>
            <div>
              <p className="font-medium leading-tight text-white">Ong Endy</p>
              <p className="font-[family-name:var(--font-geist-mono)] text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{now}</p>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 border-t border-dashed pt-5" style={{ borderColor: COLOR.line900 }}>
            {SIGNALS.map(({ Icon, label }, i) => {
              const delay = i * 0.3
              const dur = CYCLE - delay - 0.4
              return (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                    <Icon className="size-3.5" style={{ color: "rgba(255,255,255,0.55)" }} /> {label}
                  </span>
                  <motion.span
                    className="flex size-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLOR.white }}
                    animate={{ scale: [0.4, 0.4, 1, 1], opacity: [0, 0, 1, 1] }}
                    transition={{ duration: 0.4, delay, repeat: Infinity, repeatDelay: dur, ease: "backOut" }}
                  >
                    <CheckIcon className="size-3" style={{ color: COLOR.brandDeep }} />
                  </motion.span>
                </div>
              )
            })}
          </div>

          <motion.div
            className="mt-5 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold tracking-wide"
            style={{ backgroundColor: COLOR.white, color: COLOR.brandDeep }}
            animate={{ scale: [0.85, 0.85, 1, 1], opacity: [0, 0, 1, 1] }}
            transition={{ duration: 0.3, delay: 1.0, repeat: Infinity, repeatDelay: CYCLE - 1.3, ease: "backOut" }}
          >
            <ShieldCheckIcon className="size-3.5" /> MARKED PRESENT
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function FloatingBadge({ Icon, index, tilt, hovering }: { Icon: React.ComponentType<{ className?: string }>; index: number; tilt: { rx: number; ry: number }; hovering: boolean }) {
  const POS = [
    { top: "-8%", left: "-10%" },
    { top: "6%", right: "-12%" },
    { bottom: "-6%", left: "4%" },
  ][index]
  const driftX = hovering ? tilt.ry * -1.2 : 0
  const driftY = hovering ? tilt.rx * 1.2 : 0

  return (
    <motion.div
      className="absolute z-10 hidden sm:flex size-11 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md"
      style={{ ...POS, borderColor: COLOR.border, backgroundColor: "rgba(255,255,255,0.9)", color: COLOR.brand, transform: `translate3d(${driftX}px, ${driftY}px, 60px)` }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.5 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
    >
      <Icon className="size-5" />
    </motion.div>
  )
}