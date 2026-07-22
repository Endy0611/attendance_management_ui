import { GraduationCapIcon, UsersIcon, ShieldCheckIcon, CheckIcon } from "lucide-react"
import { ScrollTiltSection } from "@/components/marketing/scroll-tilt-section"
import { COLOR } from "@/components/marketing/theme"

const ROLES = [
  { icon: GraduationCapIcon, code: "ROLE / STUDENT", title: "Students", body: "Check in fast, see exactly where you stand.", points: ["Face + geofence + device check-in", "Full attendance history at a glance", "Request help if a check-in fails"] },
  { icon: UsersIcon, code: "ROLE / INSTRUCTOR", title: "Instructors", body: "Run sessions without chasing paper.", points: ["Create & manage sessions and groups", "Live absentee list per session", "Manual override when something's off"] },
  { icon: ShieldCheckIcon, code: "ROLE / ADMIN", title: "Admins", body: "Full control over the whole university.", points: ["Manage users, courses, majors, zones", "Reset devices & face enrollment", "Export attendance reports"] },
]

export function RolesSection() {
  return (
    <section id="roles" className="py-16 sm:py-24" style={{ backgroundColor: COLOR.paper }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs tracking-[0.3em] uppercase mb-3" style={{ color: COLOR.brand }}>
          Who it&apos;s for
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl max-w-lg text-balance" style={{ color: COLOR.ink }}>
          One system, three very different jobs
        </h2>

        <ScrollTiltSection className="mt-12">
          <div className="grid gap-6 sm:grid-cols-3">
            {ROLES.map(({ icon: Icon, code, title, body, points }) => (
              <div
                key={title}
                className="h-full rounded-xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1.5"
                style={{ backgroundColor: COLOR.paperAlt, border: `1px solid ${COLOR.border}`, boxShadow: "0 1px 2px rgba(5,11,22,0.04)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex aspect-square size-11 items-center justify-center rounded-xl" style={{ background: `${COLOR.brand}14`, color: COLOR.brand }}>
                    <Icon className="size-5" />
                  </div>
                  <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-wider" style={{ color: COLOR.brand }}>{code}</span>
                </div>
                <p className="mt-5 font-[family-name:var(--font-display)] text-xl" style={{ color: COLOR.ink }}>{title}</p>
                <p className="mt-1 text-sm" style={{ color: COLOR.slate }}>{body}</p>
                <div className="mt-5 border-t pt-4" style={{ borderColor: COLOR.border, borderStyle: "dashed" }}>
                  <ul className="space-y-2.5 text-sm">
                    {points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <CheckIcon className="size-4 mt-0.5 shrink-0" style={{ color: COLOR.brand }} />
                        <span style={{ color: COLOR.slate }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </ScrollTiltSection>
      </div>
    </section>
  )
}