import { Badge } from "../common/Badge"
import { CheckCircle2, Target } from "lucide-react"
import type { AspirationReadiness } from "../../types/assessment"

export function FeasibilityBadge({ readiness }: {
  value?: string
  label?: string
  readiness?: AspirationReadiness
}) {
  const ready = readiness?.status === "READY_REFERENCE"
  const text = ready ? "Đạt mốc tham chiếu" : readiness?.status === "NEEDS_IMPROVEMENT" ? "Cần cải thiện theo mốc" : "Chưa đủ bằng chứng đối chiếu"
  return <Badge tone={ready ? "emerald" : "amber"}>
    {ready ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <Target size={13} className="shrink-0 text-amber-600" />}
    <span>{text}</span>
  </Badge>
}
