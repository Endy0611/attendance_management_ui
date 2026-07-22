// components/auth/auth-brand-panel.tsx
"use client";

import { motion } from "framer-motion";
import { CalendarCheck2Icon } from "lucide-react";

export const AUTH_BRAND = "#1C4D8D";
export const AUTH_BRAND_LIGHT = "#3D82D1";
export const AUTH_BRAND_DEEP = "#0F2E52";
export const AUTH_EXIT_DURATION = 0.6; // seconds — keep in sync with the caller's setTimeout

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: (i * 137.5) % 100, // golden-angle spread, deterministic
  size: 3 + ((i * 7) % 6),
  duration: 12 + ((i * 5) % 12),
  delay: -(i * 1.7),
}));

/**
 * Fixed, full-viewport background. Sits on top of your app's normal
 * bg-background, so it inherits your light/dark theme automatically.
 * Visible motion: drifting glow blobs, a slow rotating light sweep,
 * and particles rising through the scene.
 *
 * Optionally renders a branded lockup + tagline in the bottom-left corner
 * (desktop only — mobile already gets its own lockup via AuthMobileBrand
 * inside the form panel).
 */
export function AuthBrandPanel({ exiting, tagline }: { exiting: boolean; tagline?: string }) {
  return (
    <motion.div
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: AUTH_EXIT_DURATION, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Rotating soft light sweep — the main visible motion */}
      <div
        className="sweep absolute left-1/2 top-1/2 size-[70rem] -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${AUTH_BRAND_LIGHT}22 60deg, transparent 140deg, transparent 220deg, ${AUTH_BRAND}1f 300deg, transparent 360deg)`,
        }}
      />

      {/* Drifting glow blobs */}
      <div
        className="glow-a absolute -top-48 left-[10%] size-[38rem] rounded-full blur-[100px] opacity-[0.22] dark:opacity-[0.28] motion-reduce:animate-none"
        style={{ background: AUTH_BRAND_LIGHT }}
      />
      <div
        className="glow-b absolute top-[20%] -right-48 size-[34rem] rounded-full blur-[100px] opacity-[0.18] dark:opacity-[0.24] motion-reduce:animate-none"
        style={{ background: AUTH_BRAND }}
      />
      <div
        className="glow-c absolute -bottom-56 left-[25%] size-[40rem] rounded-full blur-[110px] opacity-[0.16] dark:opacity-[0.2] motion-reduce:animate-none"
        style={{ background: AUTH_BRAND_DEEP }}
      />

      {/* Rising particles — small, clearly visible drift */}
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="particle absolute rounded-full motion-reduce:hidden"
          style={{
            left: `${p.left}%`,
            bottom: "-5%",
            width: p.size,
            height: p.size,
            background: AUTH_BRAND_LIGHT,
            opacity: 0.5,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Faint grid, ties into a "system/dashboard" feel */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25] [mask-image:radial-gradient(ellipse_at_center,black_0%,transparent_70%)]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Branded lockup + tagline — desktop only, bottom-left corner */}
      {tagline && (
        <div className="hidden md:flex absolute bottom-10 left-10 lg:bottom-14 lg:left-14 max-w-sm flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 items-center justify-center rounded-xl text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${AUTH_BRAND_LIGHT}, ${AUTH_BRAND_DEEP})` }}
            >
              <CalendarCheck2Icon className="size-4.5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">ICheck</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{tagline}</p>
        </div>
      )}

      <style>{`
        @keyframes sweep-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes glow-a-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.08); }
        }
        @keyframes glow-b-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 25px) scale(1.06); }
        }
        @keyframes glow-c-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -35px) scale(1.05); }
        }
        @keyframes particle-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) translateX(24px); opacity: 0; }
        }
        .sweep { animation: sweep-rotate 40s linear infinite; }
        .glow-a { animation: glow-a-move 18s ease-in-out infinite; }
        .glow-b { animation: glow-b-move 22s ease-in-out infinite; }
        .glow-c { animation: glow-c-move 26s ease-in-out infinite; }
        .particle { animation: particle-rise linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .sweep, .glow-a, .glow-b, .glow-c, .particle { animation: none; }
        }
      `}</style>
    </motion.div>
  );
}

/** Shared glass card wrapper for all auth screens — responsive across breakpoints. */
export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl sm:rounded-3xl border border-border/70 bg-background/70 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl"
      style={{ boxShadow: `0 20px 60px -20px ${AUTH_BRAND}33` }}
    >
      {children}
    </motion.div>
  );
}

/** Logo lockup shown at the top of every auth card. */
export function AuthMobileBrand() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div
        className="flex size-9 items-center justify-center rounded-xl text-white shadow-md"
        style={{ background: `linear-gradient(135deg, ${AUTH_BRAND_LIGHT}, ${AUTH_BRAND_DEEP})` }}
      >
        <CalendarCheck2Icon className="size-4.5" />
      </div>
      <span className="text-lg font-semibold tracking-tight text-foreground">ICheck</span>
    </div>
  );
}

/** Shared input classes for every auth form field — uses your normal tokens. */
export const authInputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 sm:py-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-transparent focus:ring-2 placeholder:text-muted-foreground/40";
export const authInputRingStyle = { ["--tw-ring-color" as string]: `${AUTH_BRAND}4D` };