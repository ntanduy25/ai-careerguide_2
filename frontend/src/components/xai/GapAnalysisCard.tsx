import { ArrowUpRight, CircleDashed } from "lucide-react"

export function GapAnalysisCard({ gaps }: { gaps: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-900">
        <CircleDashed size={18} />
        Khoảng trống cần bù
      </div>
      <div className="flex flex-wrap gap-2">
        {gaps.map((gap) => (
          <span
            key={gap}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm"
          >
            {gap}
            <ArrowUpRight size={13} />
          </span>
        ))}
      </div>
    </div>
  )
}
