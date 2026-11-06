import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CircleCheck,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useEffect, useState } from "react"
import Markdown from "react-markdown"
import { Link, useParams } from "react-router"
import remarkGfm from "remark-gfm"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { PageContainer } from "../components/layout/PageContainer"
import { ExplanationBox } from "../components/xai/ExplanationBox"
import { FeasibilityBadge } from "../components/xai/FeasibilityBadge"
import { GapAnalysisCard } from "../components/xai/GapAnalysisCard"
import { apiRequest } from "../services/api"
import { majors as fallbackMajors } from "../services/mockData"
import { readStorage, writeStorage } from "../services/storage"
import type { Major } from "../types/major"

interface TaxonomyMajorDetail {
  major_code: string
  name_vi: string
  category?: string
  description?: string
  subject_blocks?: string[]
  careers?: Array<{ title_vi: string; description?: string }>
}

interface SavedRoadmapItem {
  code: string
  label: string
  status: "TARGET" | "REACH"
}

export function MajorDetail() {
  const { id } = useParams()
  const [major, setMajor] = useState<Major>(() => {
    return (
      fallbackMajors.find((item) => item.id === id || item.code === id) ??
      fallbackMajors[0]
    )
  })
  const [taxDetail, setTaxDetail] = useState<TaxonomyMajorDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiExplaining, setAiExplaining] = useState(false)
  const [aiMarkdown, setAiMarkdown] = useState<string | null>(null)
  const [savedList, setSavedList] = useState<SavedRoadmapItem[]>(() =>
    readStorage<SavedRoadmapItem[]>("career-guide:saved-roadmaps", [
      { code: "7480101", label: "Khoa học máy tính", status: "TARGET" },
      { code: "7460108", label: "Khoa học dữ liệu", status: "REACH" },
    ]),
  )

  useEffect(() => {
    if (!id) return
    let mounted = true
    setLoading(true)
    setAiMarkdown(null)

    const localMatch = fallbackMajors.find(
      (item) => item.id === id || item.code === id,
    )
    if (localMatch) {
      setMajor(localMatch)
    }

    const codeToLookup = localMatch?.code || id

    Promise.all([
      apiRequest<Major[] | null>("/recommender/majors?top_k=108", null),
      apiRequest<TaxonomyMajorDetail | null>(
        `/taxonomy/majors/${codeToLookup}`,
        null,
      ),
    ])
      .then(([recList, taxonomyInfo]) => {
        if (!mounted) return
        if (recList && Array.isArray(recList)) {
          const found = recList.find(
            (m) => m.id === id || m.code === id || m.code === codeToLookup,
          )
          if (found) {
            setMajor(found)
          }
        }
        if (taxonomyInfo && taxonomyInfo.major_code) {
          setTaxDetail(taxonomyInfo)
          setMajor((prev) => ({
            ...prev,
            id: taxonomyInfo.major_code,
            code: taxonomyInfo.major_code,
            name: taxonomyInfo.name_vi || prev.name,
            category: taxonomyInfo.category || prev.category,
            university:
              prev.university ||
              `${taxonomyInfo.category || "Khối ngành chuẩn Bộ GD&ĐT"} · Khối ${(taxonomyInfo.subject_blocks || ["A00", "A01", "D01"]).join(", ")}`,
          }))
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id])

  const isSaved = savedList.some((item) => item.code === major.code)

  const toggleSaveMajor = () => {
    const next: SavedRoadmapItem[] = isSaved
      ? savedList.filter((item) => item.code !== major.code)
      : [
          ...savedList,
          {
            code: major.code,
            label: major.name,
            status: major.feasibility === "REACH" ? "REACH" : "TARGET",
          },
        ]
    setSavedList(next)
    writeStorage("career-guide:saved-roadmaps", next)
    window.dispatchEvent(new Event("saved-roadmaps-updated"))
  }

  const requestDeepAiExplanation = async () => {
    if (aiExplaining) return
    setAiExplaining(true)
    try {
      const res = await apiRequest<{ explanation: string } | null>(
        "/rag-governance/explain-recommendation",
        null,
        {
          method: "POST",
          body: JSON.stringify({
            major_code: major.code,
            major_name: major.name,
            overall_score: (major.match || 90) / 100,
            riasec_match: (major.fit?.interest || 90) / 100,
            academic_readiness: (major.fit?.academic || 85) / 100,
            cognitive_Alignment: (major.fit?.cognitive || 88) / 100,
            missing_skills: major.gaps || [],
          }),
        },
      )
      if (res && res.explanation) {
        setAiMarkdown(res.explanation)
      } else {
        setAiMarkdown(
          `### Phân tích XAI chuyên sâu cho ngành **${major.name} (${major.code})**\n\n` +
            `- **Tương thích sở thích (${major.fit?.interest ?? 92}%):** Hồ sơ Holland RIASEC của bạn có độ đồng điệu cao với đặc thù nghiên cứu và giải quyết bài toán thực tiễn của ngành.\n` +
            `- **Năng lực học thuật (${major.fit?.academic ?? 86}%):** Điểm chuẩn hóa Z-Score ở tổ hợp xét tuyển nằm trong vùng an toàn khả thi (${major.feasibility}).\n` +
            `- **Khuyến nghị hành động:** Tập trung bù đắp sớm các kỹ năng **${(major.gaps || ["Tư duy hệ thống", "Tiếng Anh chuyên ngành"]).join(", ")}** thông qua lộ trình thực nghiệm 4 tuần.`,
        )
      }
    } finally {
      setAiExplaining(false)
    }
  }

  const careerText =
    taxDetail?.careers && taxDetail.careers.length > 0
      ? taxDetail.careers.map((c) => c.title_vi).join(", ")
      : "Kỹ sư chuyên môn, Chuyên viên phân tích, Nghiên cứu & Phát triển (R&D), Quản lý dự án."

  const blockText =
    taxDetail?.subject_blocks && taxDetail.subject_blocks.length > 0
      ? `${taxDetail.subject_blocks.join(", ")} — Đối chiếu điểm chuẩn hóa Z-Score quốc gia.`
      : "A00, A01, D01, D07 — ưu tiên Toán, Tư duy logic và Ngoại ngữ."

  const studyDescription =
    taxDetail?.description ||
    "Chương trình đào tạo chuẩn Thông tư 09/2022/TT-BGDĐT kết hợp kiến thức nền tảng, kỹ năng thực hành chuyên sâu và dự án thực tế."

  return (
    <section className="py-10">
      <PageContainer className="max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600"
          >
            <ArrowLeft size={14} />
            Quay lại kết quả phễu đề xuất
          </Link>

          <button
            type="button"
            onClick={toggleSaveMajor}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              isSaved
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700"
            }`}
          >
            {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            {isSaved ? "Đã lưu vào Lộ trình của tôi" : "Lưu ngành này"}
          </button>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 p-7 text-white shadow-xl shadow-sky-200/60 sm:p-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-200">
                  Mã ngành {major.code}
                </p>
                {major.category && (
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-100">
                    {major.category}
                  </span>
                )}
                {loading && (
                  <Loader2 size={14} className="animate-spin text-sky-200" />
                )}
              </div>
              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                {major.name}
              </h1>
              <p className="mt-3 text-sm text-sky-100">{major.university}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <FeasibilityBadge value={major.feasibility} />
                {major.fit && (
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-sky-100">
                    <span>Sở thích: {major.fit.interest}%</span>
                    <span>·</span>
                    <span>Học lực: {major.fit.academic}%</span>
                    <span>·</span>
                    <span>Nhận thức: {major.fit.cognitive}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-5xl font-black text-sky-200">
                {major.match}%
              </span>
              <span className="block text-xs font-bold uppercase text-sky-200/80">
                Độ tương thích
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <ExplanationBox content={major.explanation} />

            {/* Deep AI XAI Analysis Card */}
            <Card className="p-5 border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-600 text-white">
                    <Sparkles size={17} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Cố vấn AI giải thích chuyên sâu (Guidance RAG)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tổng hợp lý do phù hợp từ hồ sơ 3 trụ cột và thông tư Bộ GD&ĐT
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={requestDeepAiExplanation}
                  loading={aiExplaining}
                  className="shrink-0 text-xs"
                >
                  {aiMarkdown ? "Phân tích lại" : "Phân tích bằng AI"}
                </Button>
              </div>
              {aiMarkdown && (
                <div className="mt-4 rounded-2xl border border-sky-100 bg-white p-4 text-xs leading-6 text-slate-700 shadow-2xs markdown">
                  <Markdown remarkPlugins={[remarkGfm]}>{aiMarkdown}</Markdown>
                </div>
              )}
            </Card>

            <GapAnalysisCard gaps={major.gaps} />
          </div>

          <div className="space-y-4">
            {[
              [GraduationCap, "Bạn sẽ học", studyDescription],
              [BriefcaseBusiness, "Cơ hội nghề nghiệp", careerText],
              [BookOpenCheck, "Tổ hợp xét tuyển phù hợp", blockText],
            ].map(([Icon, title, text]) => (
              <Card key={String(title)} className="p-5">
                <div className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                    <Icon size={19} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">{String(title)}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {String(text)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="mt-6 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <CircleCheck className="text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-extrabold">
                Sẵn sàng kiểm chứng lựa chọn ngành {major.name}?
              </h3>
              <p className="text-xs text-slate-500">
                Lộ trình trải nghiệm 4 tuần riêng cho mã ngành {major.code}, lưu tiến độ tự động.
              </p>
            </div>
          </div>
          <Link
            to={`/roadmap?major=${major.code}&name=${encodeURIComponent(major.name)}`}
          >
            <Button icon={ArrowRight}>Bắt đầu lộ trình 4 tuần</Button>
          </Link>
        </Card>
      </PageContainer>
    </section>
  )
}
