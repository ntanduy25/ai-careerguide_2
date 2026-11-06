import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Compass,
  Download,
  GraduationCap,
  Info,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Badge } from "../components/common/Badge"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { PageContainer } from "../components/layout/PageContainer"
import { RiasecRadarChart } from "../components/visualization/RiasecRadarChart"
import { ScoreBarChart } from "../components/visualization/ScoreBarChart"
import { TwoTierFunnelRecommendation } from "../components/xai/TwoTierFunnelRecommendation"
import { useAuth } from "../context/AuthContext"
import { useAssessment } from "../hooks/useAssessment"
import { apiRequest } from "../services/api"
import {
  defaultFunnelData,
  riasecData as fallbackRiasec,
  type RiasecRadarPoint,
} from "../services/mockData"
import type { FunnelRecommendationData, Major } from "../types/major"

interface DashboardOverviewPayload {
  user_name?: string
  riasecData?: RiasecRadarPoint[]
  scoreBarData?: Array<{ name: string; value: number }>
  majors?: Major[]
  funnel?: FunnelRecommendationData
}

interface TaxonomyCatalogItem {
  major_code: string
  name_vi: string
  category?: string
  description?: string
  subject_blocks?: string[]
}

const ARCHETYPES: Record<string, string> = {
  I: "Nhà nghiên cứu xã hội & Khoa học",
  R: "Kỹ sư Thực hành & Công nghệ",
  A: "Nhà sáng tạo Nghệ thuật & Nội dung",
  S: "Chuyên gia Kết nối & Phát triển Con người",
  E: "Nhà lãnh đạo & Chiến lược Kinh doanh",
  C: "Chuyên gia Hệ thống & Quản trị Dữ liệu",
}

export function Dashboard() {
  const { user } = useAuth()
  const { assessment } = useAssessment()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<DashboardOverviewPayload | null>(null)
  const [catalog, setCatalog] = useState<TaxonomyCatalogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [showAllCatalog, setShowAllCatalog] = useState(false)
  const catalogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    apiRequest<DashboardOverviewPayload | null>(
      "/recommender/dashboard/overview",
      null,
    )
      .then((res) => {
        if (mounted && res) {
          setData(res)
        }
      })
      .catch((err) => console.log("Dashboard API fallback notice:", err))

    apiRequest<TaxonomyCatalogItem[] | null>("/taxonomy/majors?limit=200", null)
      .then((list) => {
        if (mounted && list && Array.isArray(list)) {
          setCatalog(list)
        }
      })
      .catch((err) => console.log("Taxonomy catalog fallback notice:", err))

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (searchParams.get("search") === "1" && catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [searchParams])

  // Merge user's live assessment answers & scores with backend/default radar data
  const displayedRiasec: RiasecRadarPoint[] = useMemo(() => {
    const base =
      data?.riasecData && data.riasecData.length > 0
        ? data.riasecData
        : fallbackRiasec

    const hasUserAnswers = Object.keys(assessment.answers || {}).length >= 3
    const hasUserScores = (assessment.scores || []).length >= 2

    if (!hasUserAnswers && !hasUserScores) {
      return base
    }

    const scoreMap = Object.fromEntries(
      (assessment.scores || []).map((s) => [s.subject, s.score]),
    )
    const getSubjPct = (s1: string, s2: string, fallbackVal: number) => {
      const v1 = scoreMap[s1]
      const v2 = scoreMap[s2]
      if (v1 !== undefined && v2 !== undefined)
        return Math.min(100, Math.round(((v1 + v2) / 2) * 10))
      if (v1 !== undefined) return Math.min(100, Math.round(v1 * 10))
      if (v2 !== undefined) return Math.min(100, Math.round(v2 * 10))
      return fallbackVal
    }

    return base.map((point) => {
      let interestVal = point.value
      if (hasUserAnswers) {
        const dimVals: number[] = []
        for (let i = 1; i <= 5; i++) {
          const v = assessment.answers[`${point.key}${i}`]
          if (typeof v === "number" && v > 0) dimVals.push(v)
        }
        if (dimVals.length > 0) {
          const avg = dimVals.reduce((a, b) => a + b, 0) / dimVals.length
          interestVal = Math.round((avg / 5) * 100)
        }
      }

      let acadVal = point.academicValue ?? point.value
      if (hasUserScores) {
        if (point.key === "R")
          acadVal = getSubjPct("Vật lý", "Toán", acadVal)
        else if (point.key === "I")
          acadVal = getSubjPct("Toán", "Hóa học", acadVal)
        else if (point.key === "A")
          acadVal = getSubjPct("Ngữ văn", "Tiếng Anh", acadVal)
        else if (point.key === "S")
          acadVal = getSubjPct("Ngữ văn", "Sinh học", acadVal)
        else if (point.key === "E")
          acadVal = getSubjPct("Tiếng Anh", "Toán", acadVal)
        else if (point.key === "C")
          acadVal = getSubjPct("Toán", "Tiếng Anh", acadVal)
      }

      return {
        ...point,
        value: interestVal,
        academicValue: acadVal,
      }
    })
  }, [data?.riasecData, assessment.answers, assessment.scores])

  // Compute Top 3 RIASEC dimensions dynamically
  const top3Dimensions = useMemo(() => {
    return [...displayedRiasec]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
  }, [displayedRiasec])

  const hollandCodeBadge = useMemo(
    () => top3Dimensions.map((d) => d.key).join(" · "),
    [top3Dimensions],
  )

  const archetypeTitle = useMemo(() => {
    const primaryKey = top3Dimensions[0]?.key || "I"
    if (
      top3Dimensions[0]?.key === "I" &&
      top3Dimensions[1]?.key === "S"
    ) {
      return "Nhà nghiên cứu xã hội"
    }
    return ARCHETYPES[primaryKey] || "Nhà nghiên cứu xã hội"
  }, [top3Dimensions])

  // Compute best admission block & Z-Score dynamically
  const bestBlockStats = useMemo(() => {
    if (!assessment.scores || assessment.scores.length < 3) {
      return {
        block: "Khối A00 (Toán - Vật lý - Hóa học)",
        zScore: "+1.18",
        percentile: "Top 12%",
      }
    }
    const sm = Object.fromEntries(
      assessment.scores.map((s) => [s.subject, s.score]),
    )
    const blocks = [
      {
        name: "Khối A00 (Toán - Vật lý - Hóa học)",
        sum: (sm["Toán"] || 7.5) + (sm["Vật lý"] || 7.5) + (sm["Hóa học"] || 7.5),
      },
      {
        name: "Khối A01 (Toán - Vật lý - Tiếng Anh)",
        sum:
          (sm["Toán"] || 7.5) +
          (sm["Vật lý"] || 7.5) +
          (sm["Tiếng Anh"] || 7.5),
      },
      {
        name: "Khối D01 (Toán - Ngữ văn - Tiếng Anh)",
        sum:
          (sm["Toán"] || 7.5) +
          (sm["Ngữ văn"] || 7.5) +
          (sm["Tiếng Anh"] || 7.5),
      },
      {
        name: "Khối B00 (Toán - Hóa học - Sinh học)",
        sum:
          (sm["Toán"] || 7.5) +
          (sm["Hóa học"] || 7.5) +
          (sm["Sinh học"] || 7.5),
      },
    ].sort((a, b) => b.sum - a.sum)

    const best = blocks[0]
    const z = (best.sum - 21.3) / 3.2
    const zStr = `${z >= 0 ? "+" : ""}${z.toFixed(2)}`
    const pct =
      z >= 1.2
        ? "Top 10%"
        : z >= 0.8
          ? "Top 18%"
          : z >= 0.3
            ? "Top 30%"
            : "Top 45%"
    return { block: best.name, zScore: zStr, percentile: pct }
  }, [assessment.scores])

  const displayedBars = useMemo(() => {
    if (data?.scoreBarData && data.scoreBarData.length > 0) {
      return data.scoreBarData
    }
    const maxInterest = top3Dimensions[0]?.value || 92
    const avgAcad = Math.round(
      displayedRiasec.reduce(
        (acc, r) => acc + (r.academicValue ?? r.value),
        0,
      ) / displayedRiasec.length,
    )
    return [
      { name: "Sở thích", value: maxInterest },
      { name: "Học lực", value: avgAcad },
      { name: "Nhận thức", value: 91 },
    ]
  }, [data?.scoreBarData, top3Dimensions, displayedRiasec])

  const displayedFunnel: FunnelRecommendationData =
    data?.funnel &&
    data.funnel.tier1_fields &&
    data.funnel.tier1_fields.length > 0
      ? data.funnel
      : defaultFunnelData

  const categories = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((m) => {
      if (m.category) set.add(m.category)
    })
    return ["ALL", ...Array.from(set)]
  }, [catalog])

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return catalog.filter((item) => {
      const matchCat =
        selectedCategory === "ALL" || item.category === selectedCategory
      const matchQuery =
        !q ||
        item.major_code.toLowerCase().includes(q) ||
        item.name_vi.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      return matchCat && matchQuery
    })
  }, [catalog, searchQuery, selectedCategory])

  const visibleCatalog = showAllCatalog
    ? filteredCatalog
    : filteredCatalog.slice(0, 9)

  const handleExportPdf = () => {
    window.print()
  }

  const displayName = user?.name || data?.user_name || "Linh"

  return (
    <section className="py-9 sm:py-12">
      <PageContainer>
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-600">
              <Sparkles size={14} />
              Báo cáo phân tích XAI cá nhân hóa
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Chào {displayName}, đây là bản đồ tương lai của bạn.
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
              Kết quả đối chiếu đa chiều giữa{" "}
              <strong>Sở thích nghề nghiệp Holland</strong>,{" "}
              <strong>Năng lực học tập (Điểm học bạ & Z-Score)</strong> và{" "}
              <strong>Thiên hướng nhận thức</strong> theo mô hình phễu 2 tầng.
            </p>
          </div>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExportPdf}
          >
            Tải báo cáo PDF
          </Button>
        </div>

        {/* 2-Column Layout: Left (Radar & Score Bars) vs Right (2-Tier Funnel) */}
        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          {/* Left Column: Visual Profiles (Radar with Academic Scores & 3 Pillars) */}
          <div className="space-y-5">
            {/* Radar Card with BOTH RIASEC and Academic Scores */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                      Hồ sơ RIASEC & Điểm học tập
                    </p>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    {archetypeTitle}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Đối chiếu mức quan tâm Holland & Điểm học tập theo tổ hợp môn
                  </p>
                </div>
                <Badge tone="indigo">{hollandCodeBadge}</Badge>
              </div>

              {/* Dual-series Radar Chart (RIASEC in Sky Blue, Academic in Emerald) */}
              <RiasecRadarChart data={displayedRiasec} />

              {/* 3 Dominant Dimensions with both Interest and Academic score */}
              <div className="mt-2 grid grid-cols-3 gap-2">
                {top3Dimensions.map((item) => (
                  <div
                    className="rounded-xl bg-slate-50/80 p-3 text-center border border-slate-100 shadow-2xs"
                    key={item.key}
                  >
                    <p className="text-base font-black text-sky-600">
                      {item.key}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {item.value}%
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold text-emerald-700">
                      Học tập: {item.academicValue ?? item.value}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3-Pillar Breakdown Bars */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Chỉ số nổi bật
                  </p>
                  <h3 className="mt-1 font-extrabold text-slate-900">
                    Cấu phần phù hợp 3 Trụ Cột (NFR04)
                  </h3>
                </div>
                <TrendingUp size={21} className="text-emerald-600" />
              </div>
              <ScoreBarChart data={displayedBars} />
            </Card>

            {/* Academic Admission Overview Card */}
            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent border-emerald-200/80">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <GraduationCap size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    Điểm học tập chuẩn hóa toàn quốc
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                    Tổ hợp thế mạnh cao nhất:{" "}
                    <strong>{bestBlockStats.block}</strong> đạt phân vị{" "}
                    <span className="font-extrabold text-emerald-700">
                      {bestBlockStats.zScore} Z-Score
                    </span>{" "}
                    ({bestBlockStats.percentile} phổ điểm quốc gia).
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: 2-Tier Recommendation Funnel */}
          <div>
            <TwoTierFunnelRecommendation funnelData={displayedFunnel} />

            <div className="mt-5 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-5">
              <Info size={20} className="shrink-0 text-sky-600" />
              <p className="text-xs leading-6 text-sky-900 font-medium">
                Mô hình phễu 2 tầng giúp tránh quá tải thông tin: Đi từ{" "}
                <strong>Lĩnh vực rộng (Tầng 1)</strong> đến{" "}
                <strong>Ngành học chi tiết (Tầng 2)</strong>, đảm bảo quyết định
                dựa trên cơ sở khoa học và năng lực thực tế.
              </p>
            </div>
          </div>
        </div>

        {/* Full MOET Catalog Explorer Section */}
        {catalog.length > 0 && (
          <div ref={catalogRef} className="mt-12">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-sky-600">
                    <Compass size={15} />
                    Cơ sở dữ liệu danh mục chuẩn Bộ GD&ĐT
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Tra cứu toàn bộ {catalog.length} ngành đào tạo cấp IV (TT09)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Tìm kiếm theo mã ngành, tên ngành hoặc lọc theo lĩnh vực để xem chi tiết và lộ trình 4 tuần.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-3 text-slate-400"
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm mã ngành (7480101) hoặc tên..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold outline-none focus:border-sky-500 focus:bg-white sm:w-64"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "ALL" ? "Tất cả lĩnh vực" : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCatalog.map((item) => (
                  <Link
                    key={item.major_code}
                    to={`/majors/${item.major_code}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-extrabold text-sky-700">
                          Mã {item.major_code}
                        </span>
                        {item.subject_blocks &&
                          item.subject_blocks.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {item.subject_blocks.slice(0, 3).join(", ")}
                            </span>
                          )}
                      </div>
                      <h3 className="mt-2 text-sm font-extrabold text-slate-900 group-hover:text-sky-700">
                        {item.name_vi}
                      </h3>
                      <p className="mt-1 text-[11px] font-medium text-slate-400">
                        {item.category || "Danh mục chuẩn Bộ GD&ĐT"}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-bold text-sky-600">
                      <span>Xem chi tiết & lộ trình</span>
                      <ChevronRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                ))}
              </div>

              {filteredCatalog.length > 9 && (
                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllCatalog((v) => !v)}
                    className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-extrabold text-sky-700 transition hover:bg-sky-100"
                  >
                    {showAllCatalog
                      ? "Thu gọn danh sách"
                      : `Xem tất cả ${filteredCatalog.length} ngành phù hợp`}
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 4-Week Roadmap CTA Banner */}
        <div className="mt-8 overflow-hidden rounded-3xl bg-sky-600 p-7 text-white shadow-xl sm:p-9">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                <BookOpen size={24} />
              </span>
              <div>
                <h2 className="text-xl font-black">
                  Biến gợi ý thành trải nghiệm thật
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-sky-100">
                  Thử lộ trình 4 tuần được cá nhân hóa để kiểm chứng mức độ phù
                  hợp trước khi đặt nguyện vọng.
                </p>
              </div>
            </div>
            <Link to="/roadmap">
              <Button variant="dark" icon={ArrowRight}>
                Xem lộ trình 4 tuần
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    </section>
  )
}
