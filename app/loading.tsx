export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-muted/30">
      {/* Logo mark with breathing glow */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-20 h-20 rounded-2xl blur-xl opacity-30 animate-pulse"
          style={{ backgroundColor: "#1C4D8D" }}
        />
        <div
          className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg animate-[spin_2.5s_linear_infinite]"
          style={{
            background: "conic-gradient(from 0deg, #1C4D8D, #4A7FC1, #1C4D8D)",
          }}
        >
          <div className="flex items-center justify-center w-[calc(100%-6px)] h-[calc(100%-6px)] rounded-[14px] bg-background">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1C4D8D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Text with subtle fade */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          ICheck
        </p>
        <p className="text-xs text-muted-foreground animate-pulse">
          Preparing your workspace…
        </p>
      </div>

      {/* Thin progress shimmer */}
      <div className="w-40 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full animate-[shimmer_1.4s_ease-in-out_infinite]"
          style={{ backgroundColor: "#1C4D8D" }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}