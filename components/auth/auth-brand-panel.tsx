"use client";

import { motion } from "framer-motion";
import { CalendarCheck2Icon, ScanFaceIcon, MapPinIcon, SmartphoneIcon } from "lucide-react";

export const AUTH_BRAND = "#1C4D8D";
export const AUTH_EXIT_DURATION = 0.7; // seconds — keep in sync with the caller's setTimeout

export function AuthBrandPanel({
  exiting,
  tagline = "Smart campus attendance — your face, your location, your device, checked together.",
}: {
  exiting: boolean;
  tagline?: string;
}) {
  return (
    <motion.div
      animate={exiting ? { x: "-100%" } : { x: 0 }}
      transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
      className="relative hidden md:flex md:w-1/2 items-center justify-center overflow-hidden text-white"
      style={{ backgroundColor: AUTH_BRAND }}
    >
      {/* Decorative rotating rings, same motif as the landing page hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden">
        <div className="size-[28rem] rounded-full border border-dashed border-white/15 animate-[spin_30s_linear_infinite]" />
        <div className="absolute size-[20rem] rounded-full border border-dashed border-white/15 animate-[spin-reverse_22s_linear_infinite]" />
      </div>

      <div className="relative z-10 max-w-sm px-10 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <CalendarCheck2Icon className="size-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">ICheck</h1>
        <p className="mt-2 text-white/75">{tagline}</p>

        <div className="mt-10 flex items-center justify-center gap-6 text-white/60">
          <ScanFaceIcon className="size-5" />
          <MapPinIcon className="size-5" />
          <SmartphoneIcon className="size-5" />
        </div>
      </div>

      <style>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </motion.div>
  );
}

/** Small logo row shown at the top of the right panel on mobile, where the brand panel is hidden. */
export function AuthMobileBrand() {
  return (
    <div className="flex md:hidden items-center gap-2.5 mb-2">
      <div className="flex size-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: AUTH_BRAND }}>
        <CalendarCheck2Icon className="size-4" />
      </div>
      <span className="font-semibold tracking-tight">ICheck</span>
    </div>
  );
}

/** Shared input classes for every auth form field. */
export const authInputClass =
  "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 transition-shadow";
export const authInputRingStyle = { ["--tw-ring-color" as string]: `${AUTH_BRAND}4D` };