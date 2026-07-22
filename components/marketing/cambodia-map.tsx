"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MapPinIcon, CompassIcon } from "lucide-react"
import { ScrollTiltSection } from "@/components/marketing/scroll-tilt-section"
import { COLOR } from "@/components/marketing/theme"

function useInViewManual(ref: React.RefObject<HTMLElement | null>, options?: { once?: boolean; margin?: string }) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (options?.once) observer.disconnect()
        } else if (!options?.once) {
          setInView(false)
        }
      },
      { rootMargin: options?.margin || "0px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, options?.once, options?.margin])
  return inView
}

const HUB = { x: 48.4, y: 67.54 }

const CAMPUSES = [
  { name: "Phnom Penh", tier: "HQ CAMPUS", date: "Live since Jan 2024", x: 48.4, y: 67.54, isHub: true },
  { name: "Siem Reap", tier: "CAMPUS 02", date: "Onboarded Mar 2024", x: 30.8, y: 36.05 },
  { name: "Battambang", tier: "CAMPUS 03", date: "Onboarded Jun 2024", x: 19.44, y: 40.7 },
  { name: "Kampong Cham", tier: "CAMPUS 04", date: "Onboarded Sep 2024", x: 58.48, y: 59.73 },
  { name: "Sihanoukville", tier: "CAMPUS 05", date: "Onboarded Nov 2024", x: 25.13, y: 83.86 },
  { name: "Kratie", tier: "CAMPUS 06", date: "Onboarded Jan 2025", x: 68.36, y: 51.25 },
]

const PROVINCES = [
  { name: "Ratanakiri", d: "M94.43,12.76 L94.64,13.22 L94.15,14.54 L94.17,15.6 L93.47,17.19 L93.09,17.63 L92.76,17.72 L92.48,17.47 L92.12,17.67 L91.51,19.05 L91.71,20.07 L91.62,20.85 L90.95,22.91 L91.38,23.58 L91.36,24.64 L91.55,24.95 L92.5,24.99 L92.88,25.26 L92.88,25.76 L93.18,26.57 L92.96,27.26 L93.15,27.78 L93.01,28.31 L93.09,28.75 L94.33,30.33 L95.76,33.07 L96.0,35.41 L95.94,35.94 L95.38,37.26 L94.25,37.1 L93.54,36.61 L91.99,37.53 L91.49,36.85 L90.73,36.97 L90.3,36.19 L89.81,35.93 L89.41,36.61 L88.91,36.88 L87.87,36.75 L87.27,36.97 L86.83,36.83 L86.53,37.24 L86.87,38.13 L86.69,38.9 L86.06,39.44 L85.71,39.32 L83.1,39.49 L81.7,39.04 L78.61,36.53 L78.74,36.04 L78.47,35.51 L78.45,34.33 L77.65,32.6 L77.79,31.72 L79.44,28.7 L79.57,28.01 L79.23,26.91 L78.96,24.52 L78.75,23.75 L78.23,22.83 L78.44,21.29 L78.88,19.82 L78.53,18.29 L78.8,17.1 L80.31,17.54 L81.34,18.94 L82.04,19.56 L82.55,19.66 L83.4,19.17 L84.46,19.37 L84.72,18.73 L85.01,18.65 L85.87,17.43 L86.76,18.03 L87.15,17.91 L88.15,17.15 L88.53,16.38 L89.21,16.34 L89.46,15.53 L90.39,14.6 L90.71,14.62 L91.5,15.24 L92.6,15.55 L92.83,15.38 L92.87,14.81 L93.24,14.01 L93.63,13.77 L94.43,12.76 Z" },
  { name: "Mondulkiri", d: "M94.78,47.28 L95.21,49.2 L95.18,50.29 L94.94,50.89 L95.06,51.52 L94.33,53.76 L94.07,54.07 L93.21,54.54 L92.62,55.32 L92.22,55.34 L91.37,54.26 L90.96,54.01 L89.08,54.42 L88.05,54.92 L87.42,55.7 L84.59,58.32 L83.3,58.64 L81.76,58.56 L81.71,56.37 L81.25,55.61 L80.33,54.87 L78.39,54.26 L77.63,52.57 L74.46,50.6 L74.47,49.45 L74.92,47.8 L75.31,47.17 L76.27,46.5 L77.87,45.89 L78.76,45.01 L78.79,44.8 L78.55,43.7 L77.78,43.37 L76.48,42.47 L75.47,42.2 L74.12,40.71 L74.08,40.07 L74.31,39.71 L75.55,39.6 L75.67,39.47 L75.48,39.0 L74.61,38.36 L74.36,37.7 L74.31,35.03 L75.65,35.05 L76.73,35.8 L78.61,36.53 L81.7,39.04 L83.1,39.49 L86.18,39.38 L86.66,38.95 L86.86,38.27 L86.53,37.3 L86.83,36.83 L87.27,36.97 L87.87,36.75 L88.91,36.88 L89.41,36.61 L89.81,35.93 L90.3,36.19 L90.73,36.97 L91.49,36.85 L91.99,37.53 L93.54,36.61 L94.25,37.1 L95.38,37.26 L93.39,41.99 L93.75,42.56 L93.49,43.19 L93.86,44.61 L94.7,45.84 L94.78,47.28 Z" },
  { name: "Kratie", d: "M81.76,58.56 L81.04,58.82 L80.21,60.24 L79.85,60.34 L78.98,60.14 L79.12,60.4 L76.79,60.19 L76.26,60.56 L75.48,60.13 L73.57,60.6 L72.82,60.53 L72.12,60.73 L71.88,60.5 L70.85,60.43 L71.18,59.72 L70.8,59.03 L69.94,58.47 L69.02,58.14 L69.19,57.67 L68.98,57.24 L68.45,57.08 L68.33,56.69 L67.81,56.31 L66.22,55.83 L65.34,56.08 L65.1,55.31 L63.69,55.14 L63.72,54.62 L64.22,53.78 L64.17,52.91 L62.48,46.21 L62.64,44.82 L62.13,43.92 L62.37,43.36 L61.93,42.72 L61.73,41.4 L61.88,40.77 L61.26,39.95 L60.69,37.68 L63.11,38.67 L65.22,40.15 L66.2,40.32 L67.04,39.97 L67.59,38.73 L68.47,38.76 L68.69,37.96 L69.98,36.24 L70.37,36.07 L71.76,36.08 L72.26,35.64 L73.39,35.15 L74.31,35.03 L74.36,37.7 L74.61,38.36 L75.48,39.0 L75.67,39.47 L75.55,39.6 L74.31,39.71 L74.08,40.07 L74.12,40.71 L75.47,42.2 L76.48,42.47 L77.78,43.37 L78.55,43.7 L78.79,44.8 L78.76,45.01 L77.87,45.89 L76.27,46.5 L75.31,47.17 L74.92,47.8 L74.47,49.45 L74.46,50.6 L77.63,52.57 L78.39,54.26 L80.33,54.87 L81.25,55.61 L81.71,56.37 L81.76,58.56 Z" },
  { name: "Kampong Cham", d: "M75.58,65.31 L75.42,65.6 L75.2,65.6 L74.18,65.11 L72.79,65.34 L72.25,64.69 L71.91,64.51 L70.71,64.14 L69.99,64.12 L68.3,63.72 L67.89,64.14 L67.73,64.82 L66.88,65.93 L65.56,65.61 L64.92,65.96 L65.11,65.45 L65.01,65.03 L63.99,65.04 L62.81,64.14 L61.55,64.13 L58.65,63.67 L58.26,63.41 L57.74,62.48 L56.38,62.01 L55.87,62.2 L54.73,63.21 L53.34,64.12 L51.58,63.69 L51.58,63.16 L51.94,62.99 L51.95,62.83 L51.18,62.4 L50.64,61.66 L50.32,61.58 L50.25,61.95 L49.84,62.03 L49.37,62.92 L48.91,63.04 L48.19,62.68 L47.99,62.79 L47.87,62.2 L47.51,61.61 L48.28,60.08 L49.13,59.97 L48.83,59.67 L48.77,58.8 L48.36,58.33 L48.95,56.6 L48.7,55.65 L49.35,55.2 L50.12,55.23 L50.66,55.68 L51.2,55.84 L52.36,55.94 L52.74,56.17 L53.53,56.02 L54.12,56.39 L54.18,56.09 L53.55,54.67 L53.52,54.21 L53.04,53.38 L53.58,52.96 L55.27,52.92 L56.13,53.2 L56.69,53.62 L57.03,53.26 L57.61,51.33 L58.43,51.29 L59.48,51.78 L60.41,51.26 L63.72,50.91 L64.22,53.78 L63.72,54.62 L63.69,55.14 L65.1,55.31 L65.34,56.08 L66.32,55.85 L67.57,56.19 L68.28,56.63 L68.45,57.08 L68.9,57.16 L69.11,57.45 L69.18,57.74 L69.02,58.14 L70.03,58.52 L70.91,59.18 L71.18,59.73 L70.85,60.43 L71.88,60.5 L72.21,60.73 L72.82,60.53 L73.57,60.6 L74.9,60.32 L75.65,62.1 L75.35,62.55 L75.29,63.14 L74.94,63.86 L75.58,65.31 Z" },
  { name: "Svay Rieng", d: "M64.44,66.97 L64.61,67.26 L65.29,67.46 L65.56,67.79 L65.54,68.48 L65.84,69.66 L65.33,72.06 L66.06,72.44 L66.29,73.3 L67.83,74.02 L69.53,76.12 L70.0,75.59 L70.3,75.63 L70.81,76.17 L71.29,77.51 L70.31,77.63 L70.14,78.4 L70.66,79.48 L71.11,81.15 L70.72,80.83 L69.28,80.63 L68.34,80.23 L66.84,78.9 L66.44,79.9 L66.28,80.08 L65.92,80.08 L65.38,79.61 L64.93,78.49 L63.74,76.83 L62.77,76.92 L61.38,77.6 L60.89,76.94 L61.11,75.94 L61.54,75.31 L61.25,74.0 L61.47,73.09 L61.77,72.69 L62.18,72.58 L61.97,71.4 L61.97,70.02 L62.44,68.15 L62.82,67.4 L64.44,66.97 Z" },
  { name: "Prey Veng", d: "M65.11,65.45 L64.44,66.55 L64.44,66.97 L62.82,67.4 L62.44,68.15 L61.97,70.02 L61.97,71.4 L62.18,72.58 L61.77,72.69 L61.47,73.09 L61.25,74.0 L61.54,75.31 L61.11,75.94 L60.89,76.89 L61.38,77.6 L58.89,78.12 L57.79,77.74 L56.87,78.7 L56.18,79.9 L55.06,79.12 L54.29,78.98 L54.03,76.71 L54.77,74.41 L55.56,73.44 L55.71,73.05 L55.23,70.42 L55.78,70.08 L55.78,69.69 L54.12,68.32 L53.25,67.86 L52.65,66.93 L53.05,65.84 L52.94,65.26 L53.4,64.49 L53.34,64.12 L54.73,63.21 L55.87,62.2 L56.38,62.01 L57.74,62.48 L58.26,63.41 L58.65,63.67 L61.55,64.13 L62.81,64.14 L63.99,65.04 L65.01,65.03 L65.11,65.45 Z" },
  { name: "Kandal", d: "M54.29,78.98 L52.35,78.58 L52.01,78.02 L51.33,78.44 L51.25,78.32 L50.82,76.93 L50.95,76.38 L50.91,75.14 L51.12,74.14 L49.55,72.49 L49.47,71.29 L48.42,70.96 L46.67,71.22 L46.22,70.92 L46.91,69.89 L45.34,69.9 L44.87,69.74 L44.6,69.36 L44.93,66.47 L45.63,64.44 L46.47,63.73 L46.63,62.35 L46.97,61.79 L47.51,61.61 L47.87,62.2 L47.94,62.73 L48.19,62.68 L48.83,63.03 L49.44,62.88 L49.78,62.12 L50.25,61.95 L50.32,61.58 L50.64,61.66 L51.18,62.4 L51.89,62.76 L51.94,62.99 L51.58,63.16 L51.58,63.69 L53.34,64.12 L53.39,64.29 L53.36,64.6 L52.94,65.26 L52.98,66.1 L52.61,66.76 L53.04,67.64 L55.78,69.69 L55.78,70.08 L55.23,70.42 L55.71,73.05 L55.56,73.44 L54.77,74.41 L54.03,76.71 L54.29,78.98 Z M49.33,69.35 L50.02,68.49 L50.1,67.53 L49.69,67.29 L49.34,65.41 L48.23,65.32 L48.4,65.87 L47.46,65.88 L47.0,66.71 L46.91,67.51 L47.14,68.06 L46.86,69.13 L47.33,69.55 L48.0,69.44 L48.63,68.97 L49.33,69.35 Z" },
  { name: "Takeo", d: "M51.33,78.44 L50.86,79.11 L50.92,79.72 L51.81,81.5 L51.82,82.07 L51.4,82.47 L49.47,83.51 L48.13,85.24 L47.51,85.48 L45.46,85.36 L45.6,83.33 L45.25,83.04 L45.04,82.38 L45.54,81.25 L46.13,80.7 L45.49,79.02 L44.23,78.75 L43.32,79.03 L42.79,78.81 L42.94,77.9 L42.61,76.65 L42.22,76.36 L41.0,75.98 L40.87,75.72 L40.89,74.99 L42.55,75.33 L43.04,75.58 L44.99,75.36 L44.99,74.52 L45.49,71.75 L45.68,71.41 L46.22,70.92 L46.84,71.26 L48.31,70.96 L49.32,71.22 L49.53,71.38 L49.55,72.49 L51.12,74.14 L50.91,75.14 L50.95,76.38 L50.82,76.93 L51.33,78.44 Z" },
  { name: "Kampot", d: "M45.46,85.36 L44.16,85.2 L43.14,85.29 L41.88,87.04 L41.45,87.24 L41.13,87.18 L40.66,86.63 L40.41,86.18 L40.43,85.66 L40.02,84.84 L39.43,84.49 L38.21,84.46 L37.96,84.88 L37.63,84.56 L37.29,84.68 L37.16,84.56 L36.89,84.91 L36.44,84.92 L35.55,84.69 L34.54,84.81 L32.35,84.25 L31.85,83.77 L32.29,83.13 L32.51,82.43 L32.31,80.49 L32.44,77.87 L32.29,77.29 L33.21,76.18 L33.91,76.26 L34.17,76.15 L35.21,74.43 L35.81,74.3 L36.47,74.74 L37.84,75.03 L40.43,74.8 L40.89,74.99 L40.87,75.72 L41.0,75.98 L42.22,76.36 L42.61,76.65 L42.94,77.9 L42.79,78.81 L43.32,79.03 L44.23,78.75 L45.49,79.02 L46.13,80.7 L45.54,81.25 L45.04,82.38 L45.25,83.04 L45.6,83.33 L45.46,85.36 Z" },
  { name: "Oddar Meanchey", d: "M27.16,17.28 L27.59,17.53 L27.59,18.12 L27.77,18.33 L29.72,18.66 L30.24,18.6 L31.3,19.08 L31.6,19.05 L31.9,18.66 L32.84,18.61 L33.32,19.0 L34.08,18.79 L34.15,19.61 L34.73,20.31 L34.57,20.75 L30.05,22.83 L27.61,25.24 L26.31,25.73 L25.28,26.48 L23.45,26.95 L23.4,26.41 L23.17,26.01 L21.89,24.97 L21.66,23.89 L20.51,24.98 L19.6,24.05 L19.12,24.06 L19.28,22.92 L18.11,22.67 L17.65,21.78 L16.22,20.84 L17.97,19.55 L20.68,18.9 L22.23,18.85 L23.26,18.31 L23.73,18.54 L25.19,17.71 L25.48,17.67 L26.28,17.97 L26.64,17.79 L26.82,17.39 L27.16,17.28 Z" },
  { name: "Preah Vihear", d: "M46.69,17.35 L47.73,17.84 L48.34,17.81 L48.89,18.11 L50.21,18.38 L50.24,19.76 L50.79,20.76 L51.48,21.28 L52.42,20.99 L53.35,19.25 L53.86,18.99 L54.09,20.3 L55.12,21.82 L55.94,22.35 L56.53,23.08 L57.99,23.12 L59.92,22.14 L60.41,22.59 L60.67,22.49 L60.99,22.63 L61.38,23.2 L61.83,23.02 L62.29,23.25 L63.1,23.23 L63.58,23.48 L64.33,24.82 L66.21,26.3 L65.59,26.48 L63.26,26.52 L62.97,26.71 L63.03,27.28 L62.7,27.48 L62.29,27.31 L61.44,27.61 L60.82,27.11 L59.92,27.69 L59.79,27.91 L59.82,29.03 L60.4,29.81 L60.73,31.3 L60.51,33.75 L60.14,34.22 L57.38,35.57 L53.95,37.94 L53.52,38.51 L52.32,39.53 L50.61,40.36 L49.2,40.12 L48.82,39.73 L48.55,38.36 L48.64,37.57 L48.96,36.75 L48.83,36.53 L46.99,36.16 L45.92,36.13 L44.75,36.53 L43.08,37.43 L43.44,34.83 L45.13,32.36 L44.1,32.64 L40.62,31.87 L40.39,31.29 L40.73,30.32 L40.64,29.26 L40.28,28.27 L39.87,27.64 L39.43,27.46 L40.21,26.22 L40.25,25.66 L41.03,23.49 L41.12,22.68 L41.44,22.11 L41.95,21.65 L40.92,20.55 L41.16,20.16 L41.26,18.79 L41.85,18.5 L42.72,18.73 L43.07,18.59 L43.89,17.72 L44.9,17.88 L45.33,17.46 L45.67,17.93 L46.69,17.35 Z" },
  { name: "Siem Reap", d: "M35.74,18.64 L36.52,17.98 L36.48,18.19 L36.79,18.43 L37.59,18.03 L38.94,18.43 L41.26,18.79 L41.16,20.16 L40.92,20.55 L41.95,21.65 L41.44,22.11 L41.12,22.68 L41.03,23.49 L40.25,25.66 L40.21,26.22 L39.43,27.46 L39.87,27.64 L40.28,28.27 L40.64,29.26 L40.73,30.32 L40.41,31.43 L40.62,31.87 L41.08,32.03 L44.1,32.64 L44.98,32.33 L45.14,32.42 L43.44,34.83 L42.94,37.77 L41.7,38.5 L41.45,40.95 L41.02,41.01 L39.95,43.79 L38.05,44.93 L37.31,45.74 L37.07,46.44 L36.62,46.72 L36.0,45.87 L28.93,38.75 L27.55,36.65 L25.91,36.3 L25.36,35.77 L24.41,35.46 L23.84,35.56 L23.3,35.32 L22.97,34.92 L22.93,31.1 L23.39,30.25 L23.17,28.92 L23.18,27.59 L23.45,26.95 L25.28,26.48 L26.31,25.73 L27.61,25.24 L30.05,22.83 L34.57,20.75 L34.73,20.31 L34.15,19.61 L34.08,18.79 L35.21,18.39 L35.74,18.64 Z" },
  { name: "Banteay Meanchey", d: "M4.33,32.56 L7.47,32.51 L8.94,31.85 L7.95,31.1 L7.98,30.73 L10.69,29.13 L10.83,28.43 L11.22,27.91 L11.98,26.1 L13.66,24.64 L13.77,23.75 L14.38,22.7 L14.51,21.77 L14.78,21.5 L16.22,20.84 L17.65,21.78 L18.11,22.67 L19.28,22.92 L19.12,24.06 L19.6,24.05 L20.51,24.98 L21.66,23.89 L21.89,24.97 L23.04,25.89 L23.4,26.41 L23.45,26.95 L23.18,27.59 L23.17,28.92 L23.39,30.25 L22.93,31.1 L22.97,34.92 L20.3,35.02 L18.72,34.4 L17.84,34.5 L15.3,35.27 L14.14,35.17 L12.64,34.8 L11.8,34.25 L10.85,35.11 L10.17,34.98 L9.69,34.35 L4.28,33.94 L4.0,32.96 L4.33,32.56 Z" },
  { name: "Koh Kong", d: "M14.42,65.88 L14.69,65.48 L14.43,63.8 L13.2,62.06 L12.4,60.55 L12.23,59.68 L11.84,58.96 L15.94,59.22 L17.41,59.89 L18.46,60.09 L21.03,59.23 L21.71,58.85 L22.94,57.41 L24.46,57.26 L24.94,57.4 L25.95,58.0 L27.21,59.36 L29.53,60.37 L30.92,61.32 L29.7,61.5 L29.54,61.66 L29.59,62.53 L29.42,63.26 L29.81,65.55 L31.86,66.94 L32.23,67.37 L33.44,67.43 L34.23,67.77 L34.56,68.08 L34.29,69.06 L35.0,70.13 L35.34,70.99 L35.04,71.41 L34.9,72.31 L35.26,72.75 L35.81,74.3 L35.05,74.53 L34.92,74.99 L34.17,76.15 L33.91,76.26 L33.21,76.18 L32.29,77.29 L30.79,78.54 L30.39,78.77 L29.7,78.83 L28.84,80.82 L27.89,81.56 L27.6,81.3 L27.7,80.55 L28.31,80.04 L28.51,79.6 L28.47,78.92 L27.38,76.58 L27.64,75.99 L27.14,75.67 L26.42,75.52 L26.06,74.77 L25.18,74.27 L24.66,74.21 L24.78,74.33 L24.55,74.69 L24.06,74.46 L24.16,74.78 L23.71,75.53 L24.06,75.37 L24.09,75.55 L23.52,76.66 L23.17,77.83 L23.14,78.94 L22.04,79.32 L21.9,78.91 L20.74,78.27 L19.73,78.96 L19.79,79.21 L19.34,79.24 L19.07,79.45 L18.33,79.24 L18.13,79.16 L18.36,78.86 L17.58,78.24 L17.88,77.6 L17.63,75.7 L17.94,75.12 L17.97,74.51 L17.46,73.32 L16.93,73.26 L17.3,72.84 L17.16,72.66 L17.29,72.35 L18.25,71.61 L18.58,71.84 L18.57,71.57 L18.36,70.88 L17.88,71.13 L17.67,70.91 L17.53,70.17 L17.04,69.33 L17.4,69.58 L17.69,69.24 L18.18,69.1 L18.95,69.7 L18.24,68.51 L18.36,68.26 L18.12,68.51 L18.16,68.8 L17.88,68.97 L17.04,68.35 L16.93,67.19 L16.81,67.31 L16.93,66.83 L16.57,66.59 L16.45,67.67 L15.9,67.66 L15.49,67.91 L15.14,67.42 L15.49,67.19 L15.98,67.55 L15.62,66.96 L15.62,66.25 L15.82,66.06 L16.68,66.25 L16.68,66.12 L16.16,65.99 L16.08,65.76 L16.22,65.64 L15.85,65.76 L15.74,65.4 L15.38,66.01 L15.5,65.16 L15.69,64.89 L16.3,64.58 L16.84,64.84 L17.08,64.8 L17.4,64.46 L17.14,64.68 L16.9,64.66 L16.33,64.34 L15.62,64.69 L15.16,63.78 L14.75,63.57 L14.07,62.68 L14.32,63.25 L15.17,64.13 L15.38,64.69 L15.14,65.5 L15.32,66.5 L15.14,67.19 L14.9,66.41 L14.42,65.88 Z M20.18,80.95 L21.44,81.94 L21.45,82.19 L21.02,82.37 L20.74,82.78 L20.45,82.15 L19.63,81.73 L19.37,81.22 L19.89,80.87 L20.18,80.95 Z M16.57,70.88 L16.77,71.35 L16.68,72.35 L16.57,72.55 L16.06,72.67 L15.89,72.58 L15.98,72.42 L15.73,71.87 L15.6,70.07 L15.74,69.7 L15.85,69.93 L16.04,69.77 L16.34,69.85 L16.56,70.29 L16.57,70.88 Z M16.45,68.14 L16.81,68.97 L16.45,69.7 L16.28,69.68 L16.33,69.1 L15.85,68.17 L16.08,67.91 L16.45,68.14 Z M21.73,84.32 L21.81,84.52 L21.54,85.0 L21.0,84.34 L20.95,83.82 L21.47,83.74 L21.35,84.41 L21.56,84.5 L21.73,84.32 Z" },
  { name: "Pursat", d: "M11.84,58.96 L10.71,57.32 L10.58,56.63 L11.06,53.46 L11.7,52.74 L11.82,52.34 L12.64,52.61 L13.2,52.23 L15.19,51.43 L15.79,50.77 L16.47,51.16 L17.0,51.16 L17.52,50.82 L18.54,50.71 L20.01,49.97 L21.47,49.57 L23.5,49.73 L24.7,50.03 L26.1,49.64 L27.07,48.1 L26.74,46.69 L27.09,45.65 L26.74,45.17 L26.91,44.68 L27.7,44.17 L27.75,43.44 L28.14,42.86 L28.14,42.53 L27.77,42.19 L27.76,41.89 L29.97,39.84 L36.0,45.87 L37.47,47.73 L40.33,50.15 L40.21,52.2 L39.53,53.02 L39.23,53.76 L37.92,54.65 L37.16,54.86 L36.62,55.57 L36.42,56.54 L36.74,57.86 L36.2,58.3 L35.23,58.32 L34.32,59.75 L34.57,60.11 L33.6,60.63 L33.09,60.64 L32.33,60.04 L30.92,61.32 L29.53,60.37 L27.21,59.36 L25.95,58.0 L24.46,57.26 L22.94,57.41 L21.71,58.85 L21.03,59.23 L18.46,60.09 L17.41,59.89 L15.94,59.22 L11.84,58.96 Z" },
  { name: "Battambang", d: "M11.82,52.34 L11.59,51.93 L10.8,51.39 L10.66,50.82 L8.78,49.14 L8.26,48.77 L7.17,48.37 L10.03,47.67 L11.39,46.85 L11.64,46.4 L11.72,45.67 L11.72,43.41 L11.42,41.62 L10.67,40.61 L9.84,40.35 L9.13,40.7 L8.89,41.03 L8.58,42.25 L7.07,42.44 L6.77,42.25 L5.19,39.99 L4.26,37.58 L4.28,33.94 L9.69,34.35 L10.17,34.98 L10.85,35.11 L11.8,34.25 L12.64,34.8 L14.14,35.17 L15.3,35.27 L17.84,34.5 L18.72,34.4 L20.3,35.02 L22.97,34.92 L23.58,35.51 L24.41,35.46 L25.36,35.77 L25.91,36.3 L27.55,36.65 L27.8,36.87 L28.93,38.75 L29.97,39.84 L27.76,41.89 L27.77,42.19 L28.18,42.68 L27.75,43.44 L27.7,44.17 L26.91,44.68 L26.77,44.93 L26.78,45.33 L27.09,45.65 L26.74,46.69 L27.08,48.03 L26.27,49.51 L25.82,49.8 L24.7,50.03 L23.5,49.73 L21.47,49.57 L20.01,49.97 L18.54,50.71 L17.52,50.82 L17.0,51.16 L16.47,51.16 L15.79,50.77 L15.19,51.43 L13.2,52.23 L12.64,52.61 L11.82,52.34 Z" },
  { name: "Pailin", d: "M7.17,48.37 L6.88,47.97 L6.86,47.23 L7.36,46.05 L6.95,45.07 L6.63,43.62 L6.87,43.17 L6.67,42.89 L7.07,42.44 L8.58,42.25 L8.89,41.03 L9.13,40.7 L9.84,40.35 L10.26,40.39 L11.09,41.04 L11.63,42.36 L11.64,46.4 L11.39,46.85 L10.03,47.67 L7.17,48.37 Z" },
  { name: "Stung Treng", d: "M76.93,14.74 L77.25,15.16 L77.47,16.1 L78.2,16.38 L78.83,17.05 L78.53,18.29 L78.88,19.82 L78.44,21.29 L78.23,22.83 L78.75,23.75 L78.96,24.52 L79.23,26.91 L79.57,28.01 L79.44,28.7 L77.79,31.72 L77.65,32.6 L78.45,34.33 L78.47,35.51 L78.74,36.04 L78.61,36.53 L76.73,35.8 L75.65,35.05 L73.39,35.15 L72.26,35.64 L71.76,36.08 L70.37,36.07 L69.98,36.24 L68.69,37.96 L68.47,38.76 L67.59,38.73 L67.47,39.24 L66.94,40.07 L65.95,40.35 L64.67,39.86 L62.88,38.55 L60.69,37.68 L60.14,35.96 L60.14,34.22 L60.51,33.75 L60.73,31.3 L60.4,29.81 L59.82,29.03 L59.86,27.78 L60.82,27.11 L61.44,27.61 L62.29,27.31 L62.7,27.48 L63.03,27.28 L62.97,26.71 L63.26,26.52 L65.59,26.48 L66.21,26.3 L66.72,26.43 L67.58,26.22 L69.23,26.44 L69.48,26.14 L69.45,25.32 L70.5,24.39 L70.62,24.06 L70.54,23.74 L69.8,22.99 L69.35,21.96 L68.25,21.07 L68.11,19.96 L67.49,19.23 L67.58,18.64 L68.69,18.96 L68.99,18.94 L69.13,18.52 L71.04,18.57 L71.57,18.05 L72.02,16.47 L73.35,17.26 L75.31,16.89 L75.76,16.32 L75.56,16.21 L75.61,15.9 L76.45,15.9 L76.25,15.66 L76.23,15.2 L76.93,14.74 Z" },
  { name: "Preah Sihanouk", d: "M29.55,85.52 L29.79,85.69 L29.92,86.05 L29.9,86.42 L29.73,86.59 L29.19,86.54 L28.84,86.11 L29.19,85.88 L29.13,85.54 L29.55,85.52 Z M31.85,83.77 L31.46,83.03 L31.09,83.0 L30.97,82.32 L30.84,82.66 L30.91,83.98 L30.18,85.02 L29.25,85.17 L28.71,84.81 L28.12,84.69 L28.81,85.32 L28.9,85.63 L26.99,85.88 L26.76,85.77 L26.45,84.81 L26.1,84.93 L25.83,84.82 L25.37,84.11 L25.02,83.85 L24.73,83.97 L24.64,83.75 L25.78,81.85 L26.45,81.66 L27.89,81.6 L28.35,81.29 L28.84,80.82 L29.28,80.03 L29.7,78.83 L30.51,78.72 L32.29,77.29 L32.44,77.87 L32.31,80.49 L32.51,82.43 L32.29,83.13 L31.85,83.77 Z" },
  { name: "Kep", d: "M40.66,86.63 L40.37,86.72 L39.6,85.99 L38.46,86.11 L38.27,85.08 L37.96,84.88 L38.21,84.46 L39.82,84.64 L40.3,85.34 L40.44,86.32 L40.66,86.63 Z" },
  { name: "Kampong Chhnang", d: "M36.97,59.18 L36.42,56.54 L36.62,55.57 L37.16,54.86 L37.92,54.65 L39.23,53.76 L39.53,53.02 L40.21,52.2 L40.33,50.15 L40.83,50.52 L42.05,50.71 L42.49,50.03 L43.46,49.5 L44.23,49.29 L44.88,49.47 L46.68,50.26 L47.71,50.48 L47.59,51.19 L48.36,52.68 L48.3,53.18 L48.83,52.93 L49.14,53.03 L49.17,53.36 L48.89,53.89 L48.1,54.52 L48.93,56.36 L48.36,58.33 L48.77,58.8 L48.83,59.67 L49.13,59.97 L48.52,59.96 L48.2,60.16 L47.51,61.61 L46.88,61.86 L46.51,62.81 L44.21,63.29 L42.29,64.31 L40.6,63.47 L39.78,63.35 L38.87,62.42 L38.78,61.9 L38.15,61.02 L37.73,59.79 L36.97,59.18 Z" },
  { name: "Kampong Thom", d: "M40.83,50.52 L37.47,47.73 L36.62,46.72 L37.07,46.44 L37.31,45.74 L38.05,44.93 L39.95,43.79 L41.02,41.01 L41.45,40.95 L41.58,38.88 L41.76,38.43 L42.63,38.07 L43.08,37.43 L44.75,36.53 L45.92,36.13 L46.99,36.16 L48.66,36.48 L48.96,36.75 L48.64,37.57 L48.55,38.36 L48.82,39.73 L49.2,40.12 L50.61,40.36 L52.32,39.53 L53.52,38.51 L53.95,37.94 L57.38,35.57 L60.14,34.22 L60.23,36.54 L60.69,37.68 L61.26,39.95 L61.88,40.77 L61.73,41.4 L61.93,42.72 L62.37,43.36 L62.13,43.92 L62.64,44.82 L62.48,46.21 L63.72,50.91 L60.41,51.26 L59.48,51.78 L58.43,51.29 L57.61,51.33 L57.03,53.26 L56.69,53.62 L56.13,53.2 L55.27,52.92 L53.58,52.96 L53.04,53.38 L53.52,54.21 L53.55,54.67 L54.18,56.09 L54.12,56.39 L53.53,56.02 L52.74,56.17 L52.36,55.94 L51.2,55.84 L50.66,55.68 L50.12,55.23 L49.35,55.2 L48.7,55.65 L48.43,55.37 L48.1,54.52 L48.89,53.89 L49.18,53.21 L49.01,52.92 L48.3,53.18 L48.36,52.68 L47.59,51.19 L47.71,50.48 L46.68,50.26 L44.23,49.29 L43.76,49.37 L42.58,49.96 L42.05,50.71 L40.83,50.52 Z" },
  { name: "Kampong Speu", d: "M32.53,67.45 L29.86,65.65 L29.42,63.26 L29.59,62.53 L29.54,61.66 L29.7,61.5 L30.92,61.32 L32.33,60.04 L33.21,60.67 L34.52,60.16 L34.32,59.75 L34.81,59.17 L35.08,58.48 L35.38,58.26 L36.2,58.3 L36.74,57.86 L36.97,59.18 L37.73,59.79 L38.15,61.02 L38.78,61.9 L38.87,62.42 L39.78,63.35 L40.6,63.47 L42.29,64.31 L44.21,63.29 L46.51,62.81 L46.47,63.73 L45.63,64.44 L44.93,66.47 L44.6,69.36 L44.87,69.74 L45.34,69.9 L46.97,69.96 L45.54,71.56 L44.99,74.52 L44.99,75.36 L43.04,75.58 L40.43,74.8 L37.84,75.03 L36.09,74.55 L35.81,74.3 L35.26,72.75 L34.9,72.31 L35.04,71.41 L35.34,70.99 L35.0,70.13 L34.29,69.06 L34.56,68.08 L34.23,67.77 L33.44,67.43 L32.53,67.45 Z" },
  { name: "Phnom Penh", d: "M48.23,65.32 L49.34,65.41 L49.69,67.29 L50.1,67.53 L50.02,68.49 L49.33,69.35 L48.63,68.97 L48.0,69.44 L47.33,69.55 L46.86,69.13 L47.14,68.06 L46.91,67.51 L47.0,66.71 L47.46,65.88 L48.4,65.87 L48.23,65.32 Z" },
]

const TONLE_SAP = "M43.79,52.21 L44.07,53.15 L43.88,53.06 L43.64,52.46 L42.57,51.78 L41.91,50.86 L40.96,50.65 L40.37,50.88 L39.43,50.6 L38.3,49.96 L36.98,49.64 L35.87,48.21 L35.92,47.7 L35.61,47.68 L35.72,46.84 L35.37,46.74 L35.33,46.52 L35.5,45.88 L35.22,46.02 L34.9,45.41 L34.66,45.76 L33.7,46.13 L33.46,45.65 L33.06,45.8 L32.52,45.05 L32.26,45.24 L31.97,45.07 L31.56,44.47 L31.37,44.56 L30.85,43.98 L30.73,44.71 L30.53,44.5 L30.7,44.09 L30.62,43.87 L29.99,43.77 L29.43,42.37 L28.94,42.2 L29.43,41.72 L28.55,41.0 L28.33,40.45 L27.89,38.39 L28.16,37.83 L28.42,37.7 L29.51,38.1 L30.27,38.03 L30.51,38.39 L30.71,38.29 L31.34,38.52 L31.6,38.46 L33.04,38.92 L33.49,39.24 L34.57,40.47 L35.5,43.02 L36.24,44.06 L36.3,44.48 L36.92,45.41 L37.22,46.46 L37.45,46.78 L38.12,46.95 L40.09,46.59 L40.66,46.67 L41.21,47.07 L41.5,47.51 L41.57,48.21 L41.09,49.22 L41.7,49.7 L41.81,49.99 L41.43,50.18 L40.96,50.05 L41.06,50.32 L41.33,50.53 L41.84,50.29 L41.98,50.54 L42.28,49.93 L42.41,49.93 L42.34,50.58 L43.35,51.05 L43.61,51.63 L42.41,51.12 L42.56,51.38 L43.14,51.97 L43.79,52.21 Z"

// Two blue tones alternated across provinces so the country reads like a
// real shaded vector map on a light backdrop, not one flat blob.
const TONE = [COLOR.brand, COLOR.brandLight]

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2 - 6
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`
}

export function CambodiaMap() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewManual(ref, { once: true, margin: "-100px" })
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [hovered, setHovered] = useState<string | null>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    setTilt({ rx: (0.5 - py) * 7, ry: (px - 0.5) * 9 })
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <section id="map" className="relative overflow-hidden py-16 sm:py-24" style={{ backgroundColor: COLOR.paper }}>
      <div className="relative max-w-6xl mx-auto px-6 sm:px-10">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLOR.brand }}>
              Campus network · Cambodia
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl max-w-lg text-balance" style={{ color: COLOR.ink }}>
              Live across the country, one campus at a time
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border px-3.5 py-1.5" style={{ borderColor: COLOR.border, backgroundColor: COLOR.white }}>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: COLOR.brand }} />
              <span className="relative inline-flex size-1.5 rounded-full" style={{ backgroundColor: COLOR.brand }} />
            </span>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] tracking-wide" style={{ color: COLOR.slate }}>6 campuses online</span>
          </div>
        </div>

        <ScrollTiltSection className="mt-10">
          <div
            ref={ref}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => {
              setTilt({ rx: 0, ry: 0 })
              setHovered(null)
            }}
            className="relative w-full aspect-[16/12] rounded-2xl border overflow-hidden [perspective:1400px]"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.white, boxShadow: "0 24px 48px -28px rgba(16,24,40,0.18)" }}
          >
            {["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((pos) => (
              <div key={pos} className={`absolute z-20 size-3 ${pos}`} style={{ borderColor: COLOR.border }} />
            ))}

            <div className="absolute z-20 top-4 right-4 flex items-center gap-1.5 opacity-70">
              <CompassIcon className="size-3.5" style={{ color: COLOR.mist }} />
              <span className="font-[family-name:var(--font-geist-mono)] text-[9px] tracking-widest" style={{ color: COLOR.mist }}>N</span>
            </div>

            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="cam-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.1" floodColor={COLOR.brandDeep} floodOpacity="0.18" />
                  </filter>
                  <radialGradient id="cam-glow" cx="50%" cy="50%" r="65%">
                    <stop offset="0%" stopColor={COLOR.brandLight} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={COLOR.brandLight} stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="route-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLOR.brand} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={COLOR.brand} stopOpacity="0.2" />
                  </linearGradient>
                  <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M8 0 L0 0 0 8" fill="none" stroke={COLOR.border} strokeWidth="0.15" />
                  </pattern>
                </defs>

                <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />
                <circle cx={HUB.x} cy={HUB.y} r="26" fill="url(#cam-glow)" />

                <motion.g
                  filter="url(#cam-shadow)"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: "50px 50px" }}
                >
                  {PROVINCES.map((p, i) => (
                    <path
                      key={p.name}
                      d={p.d}
                      fill={hovered === p.name ? COLOR.brandDeep : TONE[i % TONE.length]}
                      fillOpacity={hovered === p.name ? 1 : 0.9}
                      stroke={hovered === p.name ? COLOR.brandDeep : COLOR.white}
                      strokeWidth={hovered === p.name ? "0.5" : "0.35"}
                      strokeLinejoin="round"
                      onPointerEnter={() => setHovered(p.name)}
                      onPointerLeave={() => setHovered((h) => (h === p.name ? null : h))}
                      style={{ cursor: "pointer", transition: "fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease" }}
                    />
                  ))}
                  <motion.path
                    d={TONLE_SAP}
                    fill="#BFDBFB"
                    stroke="#8FBFF0"
                    strokeWidth="0.2"
                    style={{ pointerEvents: "none" }}
                    animate={{ fillOpacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.g>

                {CAMPUSES.filter((c) => !c.isHub).map((c, i) => (
                  <g key={c.name}>
                    <motion.path
                      d={curve(HUB, c)}
                      fill="none"
                      stroke="url(#route-grad)"
                      strokeWidth="0.35"
                      strokeDasharray="1 1.4"
                      initial={{ pathLength: 0 }}
                      animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: 1.1, delay: 0.4 + i * 0.15, ease: "easeInOut" }}
                    />
                    {inView && (
                      <circle r="0.55" fill={COLOR.brand}>
                        <animateMotion
                          dur={`${2.4 + i * 0.3}s`}
                          repeatCount="indefinite"
                          begin={`${1.6 + i * 0.15}s`}
                          path={curve(HUB, c)}
                        />
                      </circle>
                    )}
                  </g>
                ))}
              </svg>

              {hovered && (
                <div
                  className="absolute z-20 pointer-events-none rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-lg border-l-2"
                  style={{
                    left: mouse.x + 14,
                    top: mouse.y - 10,
                    backgroundColor: COLOR.white,
                    borderColor: COLOR.brand,
                    color: COLOR.ink,
                    boxShadow: "0 8px 20px -6px rgba(16,24,40,0.25)",
                    transform: "translateZ(60px)",
                  }}
                >
                  {hovered}
                </div>
              )}

              {CAMPUSES.map((c, i) => (
                <motion.div
                  key={c.name}
                  className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
                  style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translateZ(40px)" }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.15 }}
                >
                  <div className="mb-1 rounded-lg border px-2.5 py-1.5 text-center shadow-md backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.96)", borderColor: COLOR.border }}>
                    <p className="text-[9px]" style={{ color: COLOR.mist }}>{c.date}</p>
                    <p className="text-xs font-semibold whitespace-nowrap" style={{ color: COLOR.ink }}>{c.name}</p>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide"
                      style={c.isHub ? { backgroundColor: COLOR.brand, color: COLOR.white } : { backgroundColor: COLOR.brandSoft, color: COLOR.brand }}
                    >
                      {c.tier}
                    </span>
                  </div>
                  {c.isHub ? (
                    <span className="relative flex size-5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50" style={{ backgroundColor: COLOR.brand }} />
                      <span className="relative inline-flex size-5 items-center justify-center rounded-full border-2" style={{ backgroundColor: COLOR.brand, borderColor: COLOR.white }}>
                        <MapPinIcon className="size-3" style={{ color: COLOR.white }} fill={COLOR.white} />
                      </span>
                    </span>
                  ) : (
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}>
                      <MapPinIcon className="size-5 drop-shadow" style={{ color: COLOR.brandLight }} fill={COLOR.brandLight} fillOpacity={0.5} />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>

            <div className="absolute z-20 bottom-3 left-3 flex items-center gap-4 rounded-lg border px-3 py-1.5 backdrop-blur-md" style={{ borderColor: COLOR.border, backgroundColor: "rgba(255,255,255,0.85)" }}>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: COLOR.slate }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: COLOR.brand }} /> HQ
              </span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: COLOR.slate }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: COLOR.brandLight }} /> Campus
              </span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: COLOR.slate }}>
                <span className="h-[2px] w-3" style={{ backgroundColor: COLOR.brand }} /> Live sync
              </span>
            </div>
          </div>
        </ScrollTiltSection>

        <p className="mt-3 text-center text-xs" style={{ color: COLOR.mist }}>
          Real provincial boundaries and Tonlé Sap — hover a province to see its name, move your cursor for the 3D tilt.
        </p>
      </div>
    </section>
  )
}