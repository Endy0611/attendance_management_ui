import {
  GraduationCapIcon, UsersIcon, ShieldCheckIcon, CheckIcon,
} from "lucide-react"
import { ScrollReveal3D } from "@/components/marketing/scroll-reveal-3d"

const BRAND = "#1C4D8D"

const ROLES = [
  {
    icon: GraduationCapIcon,
    title: "Students",
    body: "Check in fast, see exactly where you stand.",
    points: [
      "Face + geofence + device check-in",
      "Full attendance history at a glance",
      "Request help if a check-in fails",
    ],
  },
  {
    icon: UsersIcon,
    title: "Instructors",
    body: "Run sessions without chasing paper.",
    points: [
      "Create & manage sessions and groups",
      "Live absentee list per session",
      "Manual override when something's off",
    ],
  },
  {
    icon: ShieldCheckIcon,
    title: "Admins",
    body: "Full control over the whole university.",
    points: [
      "Manage users, courses, majors, zones",
      "Reset devices & face enrollment",
      "Export attendance reports",
    ],
  },
]

export function RolesSection() {
  return (
    <section id="roles" className="border-t border-border/60 bg-muted/30 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-10">
        <p
          className="font-[family-name:var(--font-geist-mono)] text-xs tracking-widest uppercase mb-3"
          style={{ color: BRAND }}
        >
          Who it&apos;s for
        </p>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight max-w-lg text-balance">
          One system, three very different jobs
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {ROLES.map(({ icon: Icon, title, body, points }, i) => (
            <ScrollReveal3D key={title} index={i}>
              <div className="rounded-2xl border border-border bg-card p-6 h-full flex flex-col">
                <div
                  className="flex aspect-square size-10 items-center justify-center rounded-lg mb-4"
                  style={{ backgroundColor: `${BRAND}1A`, color: BRAND }}
                >
                  <Icon className="size-5" />
                </div>
                <p className="font-medium text-lg">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckIcon className="size-4 mt-0.5 shrink-0" style={{ color: BRAND }} />
                      <span className="text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal3D>
          ))}
        </div>
      </div>
    </section>
  )
}