import { XIcon, CheckIcon } from "lucide-react"
import { ScrollTiltSection } from "@/components/marketing/scroll-tilt-section"
import { COLOR } from "@/components/marketing/theme"

const ROWS = [
  { old: "Paper sheets or a shared spreadsheet", now: "Face, zone, and device checked automatically" },
  { old: "One student signs in a whole row of friends", now: "One account, one device — sharing doesn't work" },
  { old: "No proof anyone was actually in the room", now: "Every check-in is geofenced to the session" },
  { old: "Instructors reconcile attendance by hand", now: "Live dashboards, no manual reconciliation" },
]

export function ComparisonSection() {
  return (
    <section className="py-16 sm:py-24" style={{ backgroundColor: COLOR.paper }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLOR.brand }}>
          Why switch
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl max-w-lg text-balance" style={{ color: COLOR.ink }}>
          The roll call nobody could trust, fixed
        </h2>

        <ScrollTiltSection className="mt-12">
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: COLOR.border, backgroundColor: COLOR.paperAlt }}>
            <div className="hidden sm:grid grid-cols-2 text-[11px] font-[family-name:var(--font-geist-mono)] tracking-widest uppercase">
              <div className="px-6 py-3" style={{ color: COLOR.slate, backgroundColor: COLOR.paper }}>Before</div>
              <div className="px-6 py-3" style={{ color: COLOR.brand, backgroundColor: COLOR.brandSoft }}>With ICheck</div>
            </div>

            {ROWS.map((row, i) => (
              <div
                key={row.old}
                className="grid sm:grid-cols-2 gap-3 sm:gap-0 border-t"
                style={{ borderColor: COLOR.border }}
              >
                <div className="flex items-start gap-3 px-6 py-4">
                  <XIcon className="size-4 mt-0.5 shrink-0" style={{ color: "#C0453F" }} />
                  <span className="text-sm" style={{ color: COLOR.slate }}>{row.old}</span>
                </div>
                <div className="flex items-start gap-3 px-6 py-4 sm:border-l" style={{ borderColor: COLOR.border, backgroundColor: i % 2 === 0 ? COLOR.brandSoft : "transparent" }}>
                  <CheckIcon className="size-4 mt-0.5 shrink-0" style={{ color: COLOR.brand }} />
                  <span className="text-sm font-medium" style={{ color: COLOR.ink }}>{row.now}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollTiltSection>
      </div>
    </section>
  )
}