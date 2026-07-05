import Link from "next/link"
import { CalendarCheck2Icon, ScanFaceIcon, MapPinIcon, SmartphoneIcon } from "lucide-react"
import { SiteNav } from "@/components/marketing/site-nav"
import { HeroSection } from "@/components/marketing/hero-section"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { RolesSection } from "@/components/marketing/roles-section"
import { CtaBand } from "@/components/marketing/cta-band"
import { ScrollReveal3D } from "@/components/marketing/scroll-reveal-3d"

const BRAND = "#1C4D8D"

const FEATURES = [
  {
    icon: ScanFaceIcon,
    title: "Face verification",
    body: "One glance confirms it's really you — no buddy punching, no passing a phone around.",
  },
  {
    icon: MapPinIcon,
    title: "Geofenced check-in",
    body: "Check-in only unlocks inside the session's zone, so attendance means actually being in the room.",
  },
  {
    icon: SmartphoneIcon,
    title: "One device per student",
    body: "Each account is bound to a single device fingerprint — sharing a login doesn't work here.",
  },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SiteNav />

      <main className="flex-1">
        <HeroSection />

        {/* ─── Features ────────────────────────────────────────────────── */}
        <section className="border-t border-border/60 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <p
              className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase mb-3"
              style={{ color: BRAND }}
            >
              What makes it hard to fake
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg text-balance">
              Three signals, all checked at once
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <ScrollReveal3D key={title} index={i}>
                  <div className="rounded-2xl border border-border bg-card p-6 h-full">
                    <div
                      className="flex aspect-square size-10 items-center justify-center rounded-lg mb-4"
                      style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <p className="font-medium">{title}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{body}</p>
                  </div>
                </ScrollReveal3D>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />
        <RolesSection />
        <CtaBand />
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <div
                className="flex aspect-square size-8 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: BRAND }}
              >
                <CalendarCheck2Icon className="size-4" />
              </div>
              <span className="font-semibold tracking-tight">ICheck</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Smart campus attendance — face, location, and device, checked together
              so a session's roll call actually means something.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#roles" className="hover:text-foreground transition-colors">Who it&apos;s for</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Account</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link href="/register" className="hover:text-foreground transition-colors">Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 px-6 sm:px-10 py-5 text-sm text-muted-foreground">
          © {new Date().getFullYear()} ICheck. University Attendance System.
        </div>
      </footer>
    </div>
  )
}