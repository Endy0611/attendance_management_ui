import { COLOR } from "./theme"

const NAMES = [
  "Royal University of Phnom Penh",
  "National University of Management",
  "Institute of Technology of Cambodia",
  "University of Puthisastra",
  "Norton University",
  "Paragon International University",
]

export function TrustStrip() {
  const items = [...NAMES, ...NAMES]
  return (
    <div
      className="overflow-hidden border-t border-b"
      style={{
        backgroundColor: COLOR.paperAlt,
        borderColor: COLOR.border,
        maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div className="py-5">
        <p className="text-center font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: COLOR.mist }}>
          Trusted at
        </p>
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-12 whitespace-nowrap">
          {items.map((name, i) => (
            <span key={i} className="text-sm font-medium" style={{ color: COLOR.slate }}>{name}</span>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  )
}