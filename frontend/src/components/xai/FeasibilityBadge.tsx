import { Badge } from "../common/Badge"

export function FeasibilityBadge({
  value = "TARGET",
}: {
  value?: "TARGET" | "REACH" | string
}) {
  const isTarget = (value || "").toUpperCase().includes("TARGET")
  return (
    <Badge tone={isTarget ? "emerald" : "amber"}>
      {isTarget ? "TARGET · Khả thi cao" : "REACH · Thử thách"}
    </Badge>
  )
}
