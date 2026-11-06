import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { riasecData, type RiasecRadarPoint } from "../../services/mockData"

interface RiasecRadarChartProps {
  data?: RiasecRadarPoint[]
}

export function RiasecRadarChart({
  data = riasecData,
}: RiasecRadarChartProps) {
  return (
    <div className="h-80 w-full pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="key"
            tick={{ fill: "#334155", fontSize: 13, fontWeight: 900 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as RiasecRadarPoint
                return (
                  <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md text-xs">
                    <p className="font-extrabold text-slate-900 mb-1.5 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
                      <span>Nhóm {item.key} · {item.label}</span>
                      {item.subjectMapping && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          {item.subjectMapping}
                        </span>
                      )}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-4 text-sky-700">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className="size-2 rounded-full bg-sky-500 inline-block" />
                          Sở thích RIASEC:
                        </span>
                        <span className="font-black">{item.value}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-emerald-700">
                        <span className="flex items-center gap-1.5 font-bold">
                          <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                          Điểm học tập quy đổi:
                        </span>
                        <span className="font-black">{item.academicValue ?? item.value}%</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          {/* Radar 1: Holland Vocational Interests */}
          <Radar
            name="Sở thích RIASEC (%)"
            dataKey="value"
            stroke="#0284c7"
            fill="#0ea5e9"
            fillOpacity={0.24}
            strokeWidth={2.5}
          />
          {/* Radar 2: Academic Readiness / Grades Z-Score */}
          <Radar
            name="Điểm học tập (%)"
            dataKey="academicValue"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.22}
            strokeWidth={2.5}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{
              paddingTop: "10px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
