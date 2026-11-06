import { motion } from "framer-motion"
import {
  ArrowRight,
  Award,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Target,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { Badge } from "../common/Badge"
import { Card } from "../common/Card"
import { FeasibilityBadge } from "./FeasibilityBadge"
import type { FunnelRecommendationData, FunnelTier1Field, Major } from "../../types/major"

interface TwoTierFunnelProps {
  funnelData: FunnelRecommendationData
}

export function TwoTierFunnelRecommendation({ funnelData }: TwoTierFunnelProps) {
  const fields = funnelData.tier1_fields || []
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | "ALL">(0)

  const displayedFields =
    selectedFieldIndex === "ALL"
      ? fields
      : [fields[selectedFieldIndex] || fields[0]].filter(Boolean)

  return (
    <div className="space-y-5">
      {/* Funnel Visual Stage Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 p-5 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-sky-500/30 text-sky-300">
              <Filter size={18} />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
                Mô hình Khuyến nghị XAI Tất định
              </span>
              <h3 className="text-base font-black tracking-tight sm:text-lg">
                Phễu đề xuất ngành 2 tầng (Hierarchical Recommendation)
              </h3>
            </div>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-200 backdrop-blur-xs self-start sm:self-auto">
            108 ngành TT09 ➔ 3 Lĩnh vực ➔ Top ngành
          </span>
        </div>

        {/* 2-Step Funnel Visual Flow Diagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-700/60 text-xs">
          <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-sky-400 font-black text-sky-950 text-xs">
              1
            </span>
            <div>
              <p className="font-extrabold text-sky-200">
                TẦNG 1: LĨNH VỰC ĐÀO TẠO
              </p>
              <p className="mt-0.5 text-[11px] text-sky-100/80 leading-relaxed">
                Tổng hợp 108 ngành từ CSDL để chọn ra <strong>Top 3 Lĩnh vực</strong> có chỉ số phù hợp cao nhất.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-emerald-400 font-black text-emerald-950 text-xs">
              2
            </span>
            <div>
              <p className="font-extrabold text-emerald-300">
                TẦNG 2: NGÀNH HỌC MÃ CẤP IV
              </p>
              <p className="mt-0.5 text-[11px] text-sky-100/80 leading-relaxed">
                Lọc sâu <strong>Top 2–3 Ngành đào tạo cụ thể</strong> đối chiếu theo khối thi, Z-Score và khả thi trúng tuyển.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 1 SELECTOR: Top 3 Fields */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 flex items-center gap-1.5">
            <Layers size={14} />
            Tầng 1: Chọn Lĩnh vực đào tạo phù hợp nhất
          </p>
          <button
            type="button"
            onClick={() => setSelectedFieldIndex(selectedFieldIndex === "ALL" ? 0 : "ALL")}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline transition-colors"
          >
            {selectedFieldIndex === "ALL" ? "Thu gọn theo lĩnh vực" : "Xem toàn cảnh phễu"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {fields.map((field, idx) => {
            const isSelected = selectedFieldIndex === idx || selectedFieldIndex === "ALL"
            const isPrimary = selectedFieldIndex === idx

            return (
              <button
                key={field.field_name}
                type="button"
                onClick={() => setSelectedFieldIndex(idx)}
                className={`relative rounded-2xl p-4 text-left transition-all duration-200 border cursor-pointer ${
                  isPrimary
                    ? "border-sky-500 bg-sky-50/90 ring-2 ring-sky-400/30 shadow-md"
                    : isSelected
                      ? "border-sky-200 bg-white hover:border-sky-300"
                      : "border-slate-200/90 bg-white/70 opacity-75 hover:opacity-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-2xl">{field.icon || "🎓"}</span>
                  <span className="text-xl font-black text-sky-600">
                    {field.match}%
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-1">
                  {field.field_name}
                </h4>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  {field.majors_count} ngành đào tạo đề xuất
                </p>
                {isPrimary && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                    Đang xem
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* TIER 2: Specific Majors in selected field(s) */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
            <Target size={14} className="text-emerald-600" />
            Tầng 2: Danh sách ngành học tối ưu hóa theo năng lực
          </p>
          <span className="text-[11px] font-semibold text-slate-400">
            {displayedFields.reduce((acc, f) => acc + (f.majors?.length || 0), 0)} ngành tối ưu
          </span>
        </div>

        {displayedFields.map((fieldSection, fIdx) => (
          <div key={fieldSection.field_name} className="space-y-3">
            {selectedFieldIndex === "ALL" && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-lg">{fieldSection.icon || "🎓"}</span>
                <h3 className="text-sm font-black text-slate-800">
                  Lĩnh vực: {fieldSection.field_name} ({fieldSection.match}% phù hợp)
                </h3>
              </div>
            )}

            <div className="space-y-3.5">
              {(fieldSection.majors || []).map((major: Major, mIdx: number) => {
                const globalRank = `${fIdx + 1}.${mIdx + 1}`

                return (
                  <motion.div
                    key={major.id || major.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: mIdx * 0.05 }}
                  >
                    <Card className="group overflow-hidden p-5 transition hover:border-sky-300 hover:shadow-md sm:p-6">
                      <div className="flex gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-700 text-xs font-black text-white shadow-xs">
                          #{globalRank}
                        </span>

                        <div className="min-w-0 flex-1">
                          {/* Title & Match % */}
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  Mã {major.code}
                                </span>
                                <span className="text-[10px] font-bold text-sky-600">
                                  {major.category || fieldSection.field_name}
                                </span>
                              </div>
                              <h4 className="mt-1.5 text-base sm:text-lg font-extrabold text-slate-950 group-hover:text-sky-950 transition-colors">
                                {major.name}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500 font-medium">
                                {major.university}
                              </p>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="text-3xl font-black text-sky-600">
                                {major.match}%
                              </span>
                              <span className="block text-[10px] font-bold uppercase text-slate-400">
                                Độ tương thích
                              </span>
                            </div>
                          </div>

                          {/* Feasibility Tag & Highlights */}
                          <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            <FeasibilityBadge value={major.feasibility} />
                            {major.fit && major.fit.interest >= 90 && (
                              <Badge tone="slate">
                                <Award size={12} className="mr-1 text-amber-500" />
                                Top sở thích
                              </Badge>
                            )}
                            {major.fit && major.fit.academic >= 85 && (
                              <Badge tone="emerald">
                                <Sparkles size={12} className="mr-1 text-emerald-600" />
                                Học lực vượt trội
                              </Badge>
                            )}
                          </div>

                          {/* 3 Pillars Score Breakdown */}
                          {major.fit && (
                            <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-xl bg-slate-50 p-3">
                              <div>
                                <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-600">
                                  <span>Sở thích</span>
                                  <span className="text-sky-700">{major.fit.interest}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-sky-500"
                                    style={{ width: `${major.fit.interest}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-600">
                                  <span>Học lực</span>
                                  <span className="text-emerald-700">{major.fit.academic}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-emerald-500"
                                    style={{ width: `${major.fit.academic}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-600">
                                  <span>Nhận thức</span>
                                  <span className="text-purple-700">{major.fit.cognitive}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-purple-500"
                                    style={{ width: `${major.fit.cognitive}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Competency Gaps */}
                          {major.gaps && major.gaps.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400">
                                Kỹ năng cần bổ sung:
                              </span>
                              {major.gaps.map((gap, gIdx) => (
                                <span
                                  key={gIdx}
                                  className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/60"
                                >
                                  {gap}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Link to Detail */}
                          <Link
                            to={`/majors/${major.id || major.code}`}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-600 hover:text-sky-800 hover:gap-2 transition-all"
                          >
                            Xem giải thích chi tiết & Lộ trình 4 tuần <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
