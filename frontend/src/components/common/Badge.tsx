import type { ReactNode } from "react"

export function Badge({
  children,
  tone = "indigo",
}: {
  children: ReactNode
  tone?: "indigo" | "emerald" | "amber" | "slate" | "rose"
}) {
  const tones = {
    indigo: "bg-sky-50 text-sky-700 ring-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
