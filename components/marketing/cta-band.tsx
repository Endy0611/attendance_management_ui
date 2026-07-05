import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

const BRAND = "#1C4D8D"

export function CtaBand() {
  return (
    <section className="py-16 sm:py-20 px-6 sm:px-10" style={{ backgroundColor: BRAND }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            Ready to stop guessing who showed up?
          </h2>
          <p className="mt-2 text-white/80 max-w-md">
            Set up your first course in a few minutes — no credit card, just a university email.
          </p>
        </div>
        <Button size="lg" asChild className="bg-white text-[#1C4D8D] hover:bg-white/90 shrink-0">
          <Link href="/register">
            Create account <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}