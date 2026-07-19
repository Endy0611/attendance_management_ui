"use client"

import { useEffect, useRef, useState, useLayoutEffect } from "react"
import { createPortal } from "react-dom"

type Position = { top: number; left: number; openUp: boolean }

export function useDropdownPosition(open: boolean, triggerRef: React.RefObject<HTMLElement | null>, menuWidth = 208) {
  const [pos, setPos] = useState<Position | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    function calculate() {
      const rect = triggerRef.current!.getBoundingClientRect()
      const viewportH = window.innerHeight
      const spaceBelow = viewportH - rect.bottom
      const openUp = spaceBelow < 260 && rect.top > 260

      setPos({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        left: Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8),
        openUp,
      })
    }

    calculate()
    window.addEventListener("scroll", calculate, true)
    window.addEventListener("resize", calculate)
    return () => {
      window.removeEventListener("scroll", calculate, true)
      window.removeEventListener("resize", calculate)
    }
  }, [open, triggerRef, menuWidth])

  return pos
}

export function DropdownPortal({
  open, onClose, position, children,
}: {
  open: boolean
  onClose: () => void
  position: Position | null
  children: React.ReactNode
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, onClose])

  if (!open || !position || typeof document === "undefined") return null

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: position.openUp ? undefined : position.top,
        bottom: position.openUp ? window.innerHeight - position.top : undefined,
        left: position.left,
        zIndex: 100,
      }}
      className="w-52 rounded-xl bg-card shadow-xl ring-1 ring-black/10 py-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>,
    document.body
  )
}