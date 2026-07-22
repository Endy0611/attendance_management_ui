import Link from "next/link"
import { CalendarCheckIcon, ScanFaceIcon, MapPinIcon, SmartphoneIcon } from "lucide-react"
import { SiteNav } from "@/components/marketing/site-nav"
import { HeroSection } from "@/components/marketing/hero-section"
import { TrustStrip } from "@/components/marketing/trust-strip"
import { ComparisonSection } from "@/components/marketing/comparison-section"
import { CambodiaMap } from "@/components/marketing/cambodia-map"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { RolesSection } from "@/components/marketing/roles-section"
import { StatsBand } from "@/components/marketing/stats-band"
import { CtaBand } from "@/components/marketing/cta-band"
import { ScrollReveal3D } from "@/components/marketing/scroll-reveal-3d"
import { COLOR } from "@/components/marketing/theme"

const FEATURES = [
  { icon: ScanFaceIcon, mark: "01", title: "Face verification", body: "One glance confirms it's really you — no buddy punching, no passing a phone around." },
  { icon: MapPinIcon, mark: "02", title: "Geofenced check-in", body: "Check-in only unlocks inside the session's zone, so attendance means actually being in the room." },
  { icon: SmartphoneIcon, mark: "03", title: "One device per student", body: "Each account is bound to a single device fingerprint — sharing a login doesn't work here." },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: COLOR.paper }}>
      <SiteNav />

      <main className="flex-1">
        <HeroSection />
        <TrustStrip />

        <section className="py-16 sm:py-24" style={{ backgroundColor: COLOR.paper }}>
          <div className="max-w-6xl mx-auto px-6 sm:px-10">
            <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLOR.brand }}>
              What makes it hard to fake
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl max-w-lg text-balance" style={{ color: COLOR.ink }}>
              Three signals, checked at once
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, mark, title, body }, i) => (
                <ScrollReveal3D key={title} index={i}>
                  <div className="relative rounded-sm border p-6 h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg" style={{ borderColor: COLOR.border, backgroundColor: COLOR.paperAlt }}>
                    <span className="absolute top-0 right-0 h-6 w-6 border-b border-l rounded-bl-sm font-[family-name:var(--font-geist-mono)] text-[10px] flex items-center justify-center" style={{ borderColor: COLOR.brand, color: COLOR.brand }}>
                      {mark}
                    </span>
                    <div className="flex aspect-square size-10 items-center justify-center rounded-full mb-4" style={{ backgroundColor: `${COLOR.brand}1A`, color: COLOR.brand }}>
                      <Icon className="size-5" />
                    </div>
                    <p className="font-medium" style={{ color: COLOR.ink }}>{title}</p>
                    <p className="mt-1.5 text-sm text-pretty" style={{ color: COLOR.slate }}>{body}</p>
                  </div>
                </ScrollReveal3D>
              ))}
            </div>
          </div>
        </section>

        <ComparisonSection />
        <CambodiaMap />
        <HowItWorks />
        <RolesSection />
        <StatsBand />
        <CtaBand />
      </main>

      <footer style={{ backgroundColor: COLOR.paper, borderTop: `1px solid ${COLOR.border}` }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid gap-10 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-xl" style={{ background: `linear-gradient(155deg, ${COLOR.brandLight}, ${COLOR.brand} 70%)`, color: COLOR.paper }}>
                <CalendarCheckIcon className="size-4" />
              </div>
              <span className="font-[family-name:var(--font-display)] text-lg" style={{ color: COLOR.ink }}>ICheck</span>
            </div>
            <p className="mt-3 text-sm max-w-xs" style={{ color: COLOR.slate }}>
              Smart campus attendance — face, location, and device, checked together
              so a session's roll call actually means something.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3" style={{ color: COLOR.ink }}>Product</p>
            <ul className="space-y-2 text-sm" style={{ color: COLOR.slate }}>
              <li><a href="#how-it-works" className="hover:opacity-70 transition-opacity">How it works</a></li>
              <li><a href="#map" className="hover:opacity-70 transition-opacity">Network</a></li>
              <li><a href="#roles" className="hover:opacity-70 transition-opacity">Who it&apos;s for</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-3" style={{ color: COLOR.ink }}>Account</p>
            <ul className="space-y-2 text-sm" style={{ color: COLOR.slate }}>
              <li><Link href="/login" className="hover:opacity-70 transition-opacity">Sign in</Link></li>
              <li><Link href="/register" className="hover:opacity-70 transition-opacity">Create account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t px-6 sm:px-10 py-5 text-sm" style={{ borderColor: COLOR.border, color: COLOR.slate }}>
          © {new Date().getFullYear()} ICheck. University Attendance System.
        </div>
      </footer>
    </div>
  )
}