import { UserPlusIcon, FingerprintIcon, ScanFaceIcon } from "lucide-react"
import { ScrollTiltSection } from "@/components/marketing/scroll-tilt-section"
import { COLOR } from "@/components/marketing/theme"

const STEPS = [
  { icon: UserPlusIcon, step: "01", title: "Register & verify", body: "Sign up with your university email, confirm the OTP, and you're in — students, instructors, and admins all go through the same door." },
  { icon: FingerprintIcon, step: "02", title: "Bind your device, once", body: "Your account locks to one device fingerprint. No more logging into a friend's phone to check in for them." },
  { icon: ScanFaceIcon, step: "03", title: "Check in each session", body: "Face scan, inside the session's zone, on your bound device. All three have to line up before you're marked present." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24" style={{ backgroundColor: COLOR.paper }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLOR.brand }}>
          How it works
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl max-w-lg text-balance" style={{ color: COLOR.ink }}>
          Three checks, every single time
        </h2>

        <ScrollTiltSection className="mt-14">
          <div className="relative">
            <div className="hidden sm:block absolute top-[22px] left-[5.5%] right-[5.5%] h-px" style={{ backgroundColor: COLOR.border }} />
            <div className="grid sm:grid-cols-3 gap-10 sm:gap-6 relative">
              {STEPS.map(({ icon: Icon, step, title, body }) => (
                <div key={step} className="relative">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative z-10 flex size-11 items-center justify-center rounded-full border shadow-sm"
                      style={{ backgroundColor: COLOR.white, borderColor: COLOR.border, color: COLOR.brand }}
                    >
                      <Icon className="size-5" />
                    </div>
                    <p className="font-[family-name:var(--font-geist-mono)] text-xs" style={{ color: COLOR.brand }}>{step}</p>
                  </div>
                  <p className="mt-5 font-[family-name:var(--font-display)] text-xl" style={{ color: COLOR.ink }}>{title}</p>
                  <p className="mt-1.5 text-sm text-pretty" style={{ color: COLOR.slate }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollTiltSection>
      </div>
    </section>
  )
}