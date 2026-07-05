import { UserPlusIcon, FingerprintIcon, ScanFaceIcon } from "lucide-react"
import { ScrollReveal3D } from "@/components/marketing/scroll-reveal-3d"

const BRAND = "#1C4D8D"

const STEPS = [
  {
    icon: UserPlusIcon,
    step: "01",
    title: "Register & verify",
    body: "Sign up with your university email, confirm the OTP, and you're in — students, instructors, and admins all go through the same door.",
  },
  {
    icon: FingerprintIcon,
    step: "02",
    title: "Bind your device, once",
    body: "Your account locks to one device fingerprint. No more logging into a friend's phone to check in for them.",
  },
  {
    icon: ScanFaceIcon,
    step: "03",
    title: "Check in each session",
    body: "Face scan, inside the session's zone, on your bound device. All three have to line up before you're marked present.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <p
          className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase mb-3"
          style={{ color: BRAND }}
        >
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg text-balance">
          Three checks, every single time
        </h2>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 relative">
          {/* Connecting line behind the steps, desktop only */}
          <div
            aria-hidden
            className="hidden sm:block absolute top-6 left-[16.5%] right-[16.5%] h-px"
            style={{ background: `linear-gradient(90deg, ${BRAND}40, ${BRAND}40)` }}
          />

          {STEPS.map(({ icon: Icon, step, title, body }, i) => (
            <ScrollReveal3D key={step} index={i}>
              <div className="relative">
                <div
                  className="relative z-10 flex size-12 items-center justify-center rounded-full text-white shadow-md"
                  style={{ backgroundColor: BRAND }}
                >
                  <Icon className="size-5" />
                </div>
                <p
                  className="mt-5 font-[family-name:var(--font-geist-mono)] text-xs"
                  style={{ color: BRAND }}
                >
                  {step}
                </p>
                <p className="mt-1 font-medium text-lg">{title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">{body}</p>
              </div>
            </ScrollReveal3D>
          ))}
        </div>
      </div>
    </section>
  )
}