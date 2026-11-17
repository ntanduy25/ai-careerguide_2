import { completeTranscriptBlocks } from "../utils/assessmentEvidence"
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Compass,
  Download,
  Eye,
  GraduationCap,
  History,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { Badge } from "../components/common/Badge"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { PageContainer } from "../components/layout/PageContainer"
import { HollandInterestSummary } from "../components/assessment/HollandInterestSummary"
import { RiasecRadarChart } from "../components/visualization/RiasecRadarChart"
import { AspirationAlignmentCard } from "../components/xai/AspirationAlignmentCard"
import { SkillAnalysisCard } from "../components/xai/SkillAnalysisCard"
import { TrendBadge } from "../components/xai/TrendBadge"
import { TwoTierFunnelRecommendation } from "../components/xai/TwoTierFunnelRecommendation"
import { useAuth } from "../context/AuthContext"
import { useAssessment } from "../hooks/useAssessment"
import { apiRequest, authPut } from "../services/api"
import {
  riasecData as fallbackRiasec,
  type RiasecRadarPoint,
} from "../services/mockData"
import type {
  InterestEvidence,
  AspirationAnalysisPayload,
  AssessmentState,
  CareerAspirationInput,
} from "../types/assessment"
import type { StudentSkillAnalysis } from "../types/insight"
import type { FunnelRecommendationData, Major } from "../types/major"
import { formatBlockWithSubjects } from "../utils"
import { buildEvaluateProfilePayload, getValidRiasecAnswer } from "../utils/assessmentPayload"

interface BestBlockStatsPayload {
  block: string
  raw_sum?: number | null
  z_score?: string
  percentile?: string
  failing_subjects?: string[]
}

interface DashboardOverviewPayload {
  has_assessment?: boolean
  user_name?: string
  gender?: string
  grade_level?: string
  horizon_label?: string
  horizon_tau?: number
  weights_applied?: {
    w_riasec?: number
    w_academic?: number
    w_preference?: number
  }
  riasecData?: RiasecRadarPoint[]
  bestBlockStats?: BestBlockStatsPayload | null
  scoreBarData?: Array<{ name: string; value: number }>
  majors?: Major[]
  funnel?: FunnelRecommendationData
  interest_evidence?: InterestEvidence
  aspirationAnalysis?: AspirationAnalysisPayload | null
}

interface TaxonomyCatalogItem {
  major_code: string
  name_vi?: string
  name?: string
  category?: string
  description?: string
  subject_blocks?: string[]
  blocks?: string[]
  is_trending?: boolean
  trend_tier?: "TIER_1" | "TIER_2" | "TIER_3" | null
  trend_priority?: number
  trend_reason?: string | null
}

const ARCHETYPES: Record<string, string> = {
  I: "Nhà nghiên cứu Khoa học",
  R: "Kỹ sư Thực hành & Công nghệ",
  A: "Nhà sáng tạo Nghệ thuật",
  S: "Chuyên gia Phát triển Con người",
  E: "Nhà lãnh đạo Kinh doanh",
  C: "Chuyên gia Quản trị Dữ liệu",
}

function formatDateTimeVi(iso?: string): string {
  if (!iso) return "Vừa xong"
  try {
    const d = new Date(iso)
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function Dashboard() {
  const { user, updateUser } = useAuth()
  const {
    assessment,
    history,
    activeHistoryId,
    update,
    reset,
    selectHistoryAttempt,
    deleteHistoryAttempt,
  } = useAssessment()

  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>(
    () =>
      user?.grade_level ||
      localStorage.getItem("career-guide:profile:grade_level") ||
      "Lớp 12",
  )
  const [selectedGender, setSelectedGender] = useState<string>(
    () =>
      user?.gender ||
      localStorage.getItem("career-guide:profile:gender") ||
      "Nam",
  )

  useEffect(() => {
    if (user?.grade_level) setSelectedGradeLevel(user.grade_level)
    if (user?.gender) setSelectedGender(user.gender)
  }, [user?.grade_level, user?.gender])

  const activeAttemptIndex = useMemo(() => {
    if (!activeHistoryId) return 0
    const idx = history.findIndex((h) => h.id === activeHistoryId)
    return idx >= 0 ? idx : 0
  }, [history, activeHistoryId])
  const activeAttempt = history[activeAttemptIndex] || null

  const effectiveAssessment = useMemo<AssessmentState>(() => {
    if (activeAttemptIndex === 0) {
      return assessment
    }
    if (activeAttempt) {
      return {
        step: 4,
        answers: activeAttempt.answers || {},
        cognitive: activeAttempt.cognitive || {},
        scores: activeAttempt.scores || [],
        aspiration: activeAttempt.aspiration,
        completed: true,
        completedAt: activeAttempt.createdAt,
      }
    }
    return assessment
  }, [assessment, activeAttempt, activeAttemptIndex])

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<DashboardOverviewPayload | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isAnalyzingAspiration, setIsAnalyzingAspiration] = useState(false)
  const [catalog, setCatalog] = useState<TaxonomyCatalogItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [showAllCatalog, setShowAllCatalog] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [skillAnalysis, setSkillAnalysis] =
    useState<StudentSkillAnalysis | null>(null)
  const [skillLoading, setSkillLoading] = useState(false)
  const aspirationRequest = useRef(0)
  const profileRef = useRef(effectiveAssessment)
  useEffect(() => { profileRef.current = effectiveAssessment }, [effectiveAssessment])
  const catalogRef = useRef<HTMLDivElement>(null)
  const reportTopRef = useRef<HTMLDivElement>(null)

  const hasCompletedAssessment = useMemo(() => {
    const hasAnswers = Object.keys(effectiveAssessment.answers || {}).length >= 3
    const hasScores = (effectiveAssessment.scores || []).length >= 2
    return Boolean(
      effectiveAssessment.completed && (hasAnswers || hasScores),
    )
  }, [effectiveAssessment.completed, effectiveAssessment.answers, effectiveAssessment.scores])

  useEffect(() => {
    let mounted = true
    const request = ++aspirationRequest.current
    setData(null)
    if (hasCompletedAssessment) {
      setIsEvaluating(true)
      setIsAnalyzingAspiration(true)
      const payload = buildEvaluateProfilePayload(effectiveAssessment, 435, {
        gender: selectedGender,
        grade_level: selectedGradeLevel,
      })
      apiRequest<DashboardOverviewPayload | null>(
        "/recommender/evaluate",
        null,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      )
        .then((res) => {
          if (mounted && request === aspirationRequest.current && res && res.funnel) {
            setData(res)
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mounted && request === aspirationRequest.current) {
            setIsEvaluating(false)
            setIsAnalyzingAspiration(false)
          }
        })
    } else {
      setData(null)
      setIsEvaluating(false)
      setIsAnalyzingAspiration(false)
    }

    apiRequest<TaxonomyCatalogItem[] | null>(
      "/taxonomy/majors?limit=1000",
      [],
    )
      .then((list) => {
        if (mounted && list && Array.isArray(list)) {
          setCatalog(list)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [
    hasCompletedAssessment,
    effectiveAssessment,
    selectedGender,
    selectedGradeLevel,
    activeHistoryId,
  ])

  const handleUpdateProfileContext = (
    nextGradeLevel: string,
    nextGender: string,
  ) => {
    setSelectedGradeLevel(nextGradeLevel)
    setSelectedGender(nextGender)
    localStorage.setItem("career-guide:profile:grade_level", nextGradeLevel)
    localStorage.setItem("career-guide:profile:gender", nextGender)
    if (user) {
      updateUser({ grade_level: nextGradeLevel, gender: nextGender })
      void authPut("/identity/profile", {
        full_name: user.name,
        gender: nextGender,
        grade_level: nextGradeLevel,
        school_class: user.school_class || "",
        school_name: user.school_name || "",
      }).catch(() => {})
    }
  }

  // Agent "Phân tích kỹ năng": ưu/nhược điểm học tập + kỹ năng cần bổ sung
  // (cache theo hồ sơ năng lực ở backend nên chỉ tốn AI lần đầu).
  useEffect(() => {
    if (!hasCompletedAssessment) {
      setSkillAnalysis(null)
      setSkillLoading(false)
      return
    }

    let mounted = true
    setSkillAnalysis(null)
    const skillPayload = buildEvaluateProfilePayload(effectiveAssessment)

    setSkillLoading(true)
    apiRequest<StudentSkillAnalysis | null>(
      "/major-insights/student-skills",
      null,
      {
        method: "POST",
        body: JSON.stringify({ ...skillPayload, major_code: data?.majors?.[0]?.code }),
      },
    )
      .then((res) => {
        if (mounted && res) setSkillAnalysis(res)
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setSkillLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [
    hasCompletedAssessment,
    effectiveAssessment,
    data?.majors,
  ])

  const handleUpdateAspiration = async (nextAspiration: CareerAspirationInput) => {
    if (activeAttemptIndex > 0) throw new Error("Không sửa bản xem lại")
    const snapshot = effectiveAssessment
    const request = ++aspirationRequest.current
    setIsAnalyzingAspiration(true)
    try {
      const response = await apiRequest<DashboardOverviewPayload | null>("/recommender/evaluate", null, {
        method: "POST",
        body: JSON.stringify(buildEvaluateProfilePayload({ ...snapshot, aspiration: nextAspiration }, 435, { gender: selectedGender, grade_level: selectedGradeLevel })),
      })
      if (request !== aspirationRequest.current || profileRef.current !== snapshot) throw new Error("Hồ sơ đã đổi")
      if (!response?.aspirationAnalysis) throw new Error("Chưa có phân tích")
      update({ aspiration: nextAspiration })
      setData(response)
    } finally {
      if (request === aspirationRequest.current) { setIsAnalyzingAspiration(false); setIsEvaluating(false) }
    }
  }

  useEffect(() => {
    if (searchParams.get("search") === "1" && catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [searchParams])

  // Merge user's live/selected assessment answers & scores into RIASEC radar data (prioritizing Backend result)
  const displayedRiasec: RiasecRadarPoint[] = useMemo(() => {
    if (data?.riasecData && data.riasecData.length > 0) {
      return data.riasecData
    }
    const groups = "RIASEC".split("")
    return fallbackRiasec.flatMap(point => {
      const index = groups.indexOf(point.key)
      const values = Array.from({ length: 5 }, (_, i) => getValidRiasecAnswer(effectiveAssessment.answers, `${point.key}${i + 1}`, index * 5 + i)).filter((v): v is number => v !== undefined)
      if (!values.length) return []
      return [{ ...point, value: Math.round((values.reduce((a, b) => a + b, 0) / values.length - 1) / 4 * 100), academicValue: null }]
    })
  }, [data?.riasecData, effectiveAssessment.answers])

  const interestEvidence: InterestEvidence = useMemo(() => {
    if (data?.interest_evidence) return data.interest_evidence
    const groups = (["R", "I", "A", "S", "E", "C"] as const).map((code, index) => {
      const values = Array.from({ length: 5 }, (_, i) => getValidRiasecAnswer(effectiveAssessment.answers, `${code}${i + 1}`, index * 5 + i)).filter((v): v is number => v !== undefined)
      return { code, percent: values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length - 1) / 4 * 100) : null, answered: values.length, total: 5 }
    })
    const total = groups.reduce((sum, g) => sum + g.answered, 0)
    return { status: total === 30 ? "COMPLETE" : total ? "PARTIAL" : "MISSING", groups }
  }, [data, effectiveAssessment.answers])

  const top3Dimensions = useMemo(() => {
    if (interestEvidence.status !== "COMPLETE") return []
    const sorted = [...displayedRiasec].filter(point => Number.isFinite(point.value)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const threshold = sorted[2]?.value ?? 0
    return sorted.filter(point => (point.value ?? 0) >= threshold)
  }, [displayedRiasec, interestEvidence.status])

  const hollandCodeBadge = useMemo(
    () => top3Dimensions.map((d) => d.key).join(" · "),
    [top3Dimensions],
  )

  const archetypeTitle = useMemo(() => {
    if (interestEvidence.status === "NON_DISCRIMINATING") return "Sở thích chưa phân biệt giữa các nhóm"
    const primaryKey = top3Dimensions[0]?.key
    if (top3Dimensions.length > 1 && top3Dimensions[0].value === top3Dimensions[1].value) return "Nhiều nhóm sở thích đồng điểm cao nhất"
    return primaryKey ? ARCHETYPES[primaryKey] : "Chưa đủ dữ liệu sở thích"
  }, [top3Dimensions, interestEvidence.status])

  const bestBlockStats = useMemo(() => {
    if (data?.bestBlockStats && data.bestBlockStats.block) {
      return {
        block: data.bestBlockStats.block,
        rawSum: data.bestBlockStats.raw_sum ?? 0,
        zScore: data.bestBlockStats.z_score ?? "Chưa xác minh",
        percentile: data.bestBlockStats.percentile ?? "Chưa có nguồn phân phối điểm",
        failingSubjects: data.bestBlockStats.failing_subjects ?? [],
      }
    }

    const best = completeTranscriptBlocks(effectiveAssessment.scores || [])[0]
    return {
      block: best ? `Khối ${best.code} (${best.subjects.join(", ")})` : "Chưa đủ tổ hợp môn",
      rawSum: best?.sum ?? null,
      zScore: "Chưa xác minh",
      percentile: "Điểm học bạ tự khai; chưa đối chiếu phân phối thi",
      failingSubjects: (effectiveAssessment.scores || []).filter(item => Number.isFinite(item.score) && item.score <= 1).map(item => `${item.subject} (${item.score}đ)`),
    }

  }, [data, effectiveAssessment.scores])

  const activeFunnel: FunnelRecommendationData = data?.funnel ?? { tier1_fields: [], all_majors: [] }

  const categories = useMemo(() => {
    const set = new Set<string>()
    catalog.forEach((m) => {
      if (m.category) set.add(m.category)
    })
    return ["ALL", ...Array.from(set)]
  }, [catalog])

  const filteredCatalog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return catalog
      .filter((item) => {
        const majorName = (item.name_vi || item.name || "").toLowerCase()
        const matchCat =
          selectedCategory === "ALL" || item.category === selectedCategory
        const matchQuery =
          !q ||
          item.major_code.toLowerCase().includes(q) ||
          majorName.includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
        return matchCat && matchQuery
      })
      .sort((a, b) => (b.trend_priority || 0) - (a.trend_priority || 0))
  }, [catalog, searchQuery, selectedCategory])

  const visibleCatalog = showAllCatalog
    ? filteredCatalog
    : filteredCatalog.slice(0, 9)

  const handleExportPdf = () => {
    window.print()
  }

  const handleRetakeAssessment = () => {
    reset()
    navigate("/assessment")
  }

  const handleSelectHistory = (attemptId: string) => {
    selectHistoryAttempt(attemptId)
    setShowHistoryDrawer(false)
    setData(null)
    reportTopRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const displayName = user?.name || data?.user_name || "Học sinh"

  return (
    <section className="py-9 sm:py-12" ref={reportTopRef}>
      <PageContainer>
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-600">
              <Sparkles size={14} />
              AI CareerGuide · 435 Ngành
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              {hasCompletedAssessment
                ? `Chào ${displayName}, đề xuất ngành của bạn.`
                : `Chào ${displayName}, khám phá bản thân.`}
            </h1>
          </div>

          {hasCompletedAssessment && (
            <div className="flex flex-wrap items-center gap-2.5">
              {history.length > 0 && (
                <Button
                  variant="secondary"
                  icon={History}
                  onClick={() => setShowHistoryDrawer((v) => !v)}
                >
                  Lịch sử ({history.length})
                </Button>
              )}
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={handleRetakeAssessment}
              >
                Làm lại
              </Button>
              <Button
                variant="secondary"
                icon={Download}
                onClick={handleExportPdf}
              >
                Xuất PDF
              </Button>
            </div>
          )}
        </div>

        {activeAttemptIndex === 0 && assessment.syncStatus === "LOCAL_ONLY" && <p role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Đã lưu trên thiết bị, chưa đồng bộ máy chủ. Bài làm vẫn được giữ trên trình duyệt này; hãy mở lại bài đánh giá và gửi lại khi kết nối hoạt động.</p>}
        {activeAttemptIndex === 0 && assessment.syncStatus === "SYNCED" && assessment.submissionId && <p role="status" className="mb-5 text-xs text-slate-600">Đã đồng bộ bài đánh giá với máy chủ.</p>}

        {/* Liquid Glass Empty State when Student has NOT completed the Assessment */}
        {!hasCompletedAssessment ? (
          <div className="relative mb-10 overflow-hidden rounded-[36px] border border-white/80 bg-white/40 p-8 shadow-[0_24px_80px_rgba(14,165,233,0.14)] backdrop-blur-2xl sm:p-14">
            <div className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full bg-sky-300/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 size-80 rounded-full bg-cyan-200/40 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-1.5 text-xs font-extrabold tracking-wide text-sky-700 shadow-2xs backdrop-blur-md">
                <ClipboardCheck size={14} />
                Chưa có dữ liệu trắc nghiệm
              </span>

              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Làm bài đánh giá để mở khóa đề xuất từ 435 ngành
              </h2>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { weight: "45%", title: "Sở thích RIASEC" },
                  { weight: "35%", title: "Học lực Z-Score" },
                  { weight: "20%", title: "Nhận thức" },
                ].map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-3xl border border-white/80 bg-white/50 p-5 text-center shadow-[0_8px_30px_rgba(14,165,233,0.07)] backdrop-blur-xl"
                  >
                    <p className="text-2xl font-black text-sky-600">
                      {pillar.weight}
                    </p>
                    <h3 className="mt-1 text-sm font-extrabold text-slate-900">
                      {pillar.title}
                    </h3>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex justify-center">
                <Link to="/assessment">
                  <Button
                    icon={ArrowRight}
                    className="rounded-2xl px-8 py-3.5 text-sm shadow-lg shadow-sky-500/20"
                  >
                    Bắt đầu đánh giá ngay
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Collapsible History Drawer (only visible when user clicks "Lịch sử" or has multiple attempts) */}
            {(showHistoryDrawer || history.length > 1) && (
              <div className="mb-6 rounded-3xl border border-white/80 bg-white/50 p-4 shadow-[0_10px_35px_rgba(14,165,233,0.08)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-sky-500/15 text-sky-600">
                      <Clock size={15} />
                    </span>
                    <span>
                      Lần #{history.length - activeAttemptIndex}
                      <span className="ml-2 font-medium text-slate-400">
                        {formatDateTimeVi(
                          activeAttempt?.createdAt || assessment.completedAt,
                        )}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {history.map((item, idx) => {
                      const isCurrent =
                        item.id === (activeAttempt?.id || history[0]?.id)
                      const attemptNumber = history.length - idx
                      return (
                        <div key={item.id} className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSelectHistory(item.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              isCurrent
                                ? "bg-sky-600 text-white shadow-xs"
                                : "border border-white/80 bg-white/60 text-slate-600 hover:bg-white hover:text-sky-700"
                            }`}
                          >
                            {isCurrent ? <CheckCircle2 size={12} /> : <Eye size={12} />}
                            Lần #{attemptNumber} · Hồ sơ đã lưu
                          </button>
                          {history.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteHistoryAttempt(item.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/70 hover:text-slate-700"
                              title="Xóa"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 1. Hồ sơ RIASEC & Phễu Ngành đề xuất 2 tầng */}
            <div className="mb-8 grid gap-6 lg:grid-cols-12 xl:gap-8">
              {/* Left Column: Single Unified Profile Card */}
              <div className="lg:col-span-5 xl:col-span-4">
                <Card className="rounded-2xl p-5 sm:rounded-3xl sm:p-6 sticky top-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                        Hồ sơ Định hướng
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                        {archetypeTitle}
                      </h2>
                    </div>
                    <Badge tone="indigo">{hollandCodeBadge}</Badge>
                  </div>

                  {interestEvidence.status === "COMPLETE" && displayedRiasec.length === 6 && displayedRiasec.every(point => Number.isFinite(point.value)) ? <RiasecRadarChart data={displayedRiasec} /> : <HollandInterestSummary evidence={interestEvidence} />}

                  <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-2.5">
                    {top3Dimensions.map((item) => (
                      <div
                        className="rounded-xl border border-slate-200/80 bg-white/70 p-2.5 text-center sm:p-3"
                        key={item.key}
                      >
                        <p className="text-base font-bold text-sky-600 sm:text-lg">
                          {item.key}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
                          {item.value}%
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={18} className="text-sky-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {formatBlockWithSubjects(bestBlockStats.block, { short: true })}
                        {bestBlockStats.rawSum ? ` · ${bestBlockStats.rawSum}đ` : ""}
                      </span>
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-sky-700">
                      Z-Score {bestBlockStats.zScore} · {bestBlockStats.percentile}
                    </span>
                  </div>
                  {bestBlockStats.failingSubjects.length > 0 && (
                    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                      Cảnh báo điểm liệt: {bestBlockStats.failingSubjects.join(", ")}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: 2-Tier Recommendation Funnel */}
              <div className="lg:col-span-7 xl:col-span-8">
                <TwoTierFunnelRecommendation
                  funnelData={activeFunnel}
                  isLoading={isEvaluating && (!activeFunnel.tier1_fields || activeFunnel.tier1_fields.length === 0)}
                  activeGradeLevel={selectedGradeLevel}
                  activeGender={selectedGender}
                  horizonLabel={data?.horizon_label || activeFunnel.horizon_label}
                  weightsApplied={data?.weights_applied}
                  onUpdateProfileContext={handleUpdateProfileContext}
                />
              </div>
            </div>

            {/* 2. AI Đối chiếu nguyện vọng */}
            <AspirationAlignmentCard
              analysis={data?.aspirationAnalysis ?? null}
              currentAspiration={effectiveAssessment.aspiration}
              onUpdateAspiration={handleUpdateAspiration}
              isAnalyzing={isAnalyzingAspiration}
              readOnly={activeAttemptIndex > 0}
            />

            {/* 3. Phân tích kỹ năng của bạn */}
            <div className="mt-6 mb-6">
              <SkillAnalysisCard data={skillAnalysis} loading={skillLoading} />
            </div>
          </>
        )}

        {/* Full 435 MOET Majors Catalog Explorer Section */}
        <div ref={catalogRef} className="mt-10">
          <Card className="rounded-[32px] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-sky-600">
                  <Compass size={15} />
                  Danh mục chuẩn Bộ GD&ĐT
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Khám phá {catalog.length} ngành đào tạo
                </h2>
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
                    placeholder="Tìm mã hoặc tên ngành..."
                    className="h-10 w-full rounded-xl border border-white/85 bg-white/65 pl-9 pr-3 text-xs font-semibold outline-none backdrop-blur-md focus:border-sky-400 focus:bg-white sm:w-60"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 rounded-xl border border-white/85 bg-white/65 px-3 text-xs font-bold text-slate-700 outline-none backdrop-blur-md focus:border-sky-400"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "ALL" ? "Tất cả lĩnh vực" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
              {visibleCatalog.map((item) => {
                const blocks = item.subject_blocks || item.blocks || []
                const majorName = item.name_vi || item.name || item.major_code
                return (
                  <Link
                    key={item.major_code}
                    to={`/majors/${item.major_code}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/75 p-4 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white hover:shadow-md"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                            Mã {item.major_code}
                          </span>
                          <TrendBadge
                            tier={item.trend_tier}
                            isTrending={item.is_trending}
                            reason={item.trend_reason}
                          />
                        </div>
                        {blocks.length > 0 && (
                          <span className="text-xs font-medium text-slate-500">
                            {blocks.slice(0, 3).join(", ")}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2.5 text-sm font-bold text-slate-900 group-hover:text-sky-700 leading-snug">
                        {majorName}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category || "Danh mục ngành"}
                      </p>
                    </div>
                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-bold text-sky-600">
                      <span>Xem chi tiết</span>
                      <ChevronRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                )
              })}
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
                    : `Xem tất cả ${filteredCatalog.length} ngành`}
                </button>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </section>
  )
}
