import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

interface ScoreDatum {
  name: string
  value: number
}

export function ScoreBarChart({ data }: { data: ScoreDatum[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 6, right: 16 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="#e2e8f0"
          />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: 12, fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={["#0284c7", "#10b981", "#f59e0b"][index % 3]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
