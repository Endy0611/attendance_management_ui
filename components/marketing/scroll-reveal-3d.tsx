"use client"

import { motion } from "framer-motion"

export function ScrollReveal3D({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <motion.div
      style={{ perspective: 1000 }}
      initial={{ opacity: 0, rotateX: -40, y: 32 }}
      whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}