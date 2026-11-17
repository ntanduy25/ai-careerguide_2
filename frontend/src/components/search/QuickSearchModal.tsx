import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search,
  X,
  Sparkles,
  TrendingUp,
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Compass,
} from "lucide-react"
import { MOET_435_MAJORS, type MoetCatalogMajor } from "../../data/moetMajors435"

interface QuickSearchModalProps {
  open: boolean
  onClose: () => void
}

function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

const FEATURED_TRENDING = [
  { code: "7480107", name: "Trí tuệ nhân tạo (AI)", tag: "Mũi nhọn 2026" },
  { code: "7520202", name: "Kỹ thuật vi mạch bán dẫn", tag: "Chiến lược quốc gia" },
  { code: "7480208", name: "An toàn thông tin / An ninh mạng", tag: "Khát nhân lực" },
  { code: "7460108", name: "Khoa học dữ liệu", tag: "Cốt lõi số" },
  { code: "7340205", name: "Công nghệ tài chính (Fintech)", tag: "Tăng trưởng cao" },
  { code: "7340123", name: "Logistics & Chuỗi cung ứng", tag: "Toàn cầu" },
  { code: "7480103", name: "Kỹ thuật phần mềm", tag: "Nhu cầu bền vững" },
  { code: "7310109", name: "Kinh tế số", tag: "Xu hướng mới" },
]

export function QuickSearchModal({ open, onClose }: QuickSearchModalProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIndex(0)
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Lọc ngành học thời gian thực
  const filteredMajors = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const cleanQ = removeAccents(q)
    return MOET_435_MAJORS.filter((m) => {
      const codeMatch = m.major_code.includes(q)
      const nameMatch = removeAccents(m.name_vi).includes(cleanQ)
      const catMatch = removeAccents(m.category).includes(cleanQ)
      const blockMatch = (m.subject_blocks || []).some((b) =>
        b.toLowerCase().includes(q.toLowerCase()),
      )
      return codeMatch || nameMatch || catMatch || blockMatch
    }).slice(0, 12)
  }, [query])

  const handleSelectMajor = (majorCode: string) => {
    onClose()
    navigate(`/majors/${majorCode}`)
  }

  // Xử lý phím mũi tên & Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
      return
    }
    if (filteredMajors.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredMajors.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredMajors.length - 1 : prev - 1,
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      const selected = filteredMajors[selectedIndex]
      if (selected) {
        handleSelectMajor(selected.major_code)
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
          {/* Backdrop mờ phía sau */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-sky-100 bg-white/95 shadow-2xl backdrop-blur-2xl"
          >
            {/* Input Header */}
            <div className="relative flex items-center border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
              <Search className="size-5 shrink-0 text-sky-600" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tìm tên ngành, mã ngành (748...), nhóm ngành hoặc khối xét tuyển..."
                className="w-full bg-transparent px-3.5 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("")
                    inputRef.current?.focus()
                  }}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                  ESC để đóng
                </kbd>
              )}
            </div>

            {/* Body Content */}
            <div
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto p-4 sm:p-5"
            >
              {/* Khi chưa gõ tìm kiếm: Gợi ý các ngành xu hướng nổi bật */}
              {!query.trim() && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    <Sparkles className="size-3.5 text-sky-600" />
                    <span>Ngành học xu hướng nổi bật năm 2026</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {FEATURED_TRENDING.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleSelectMajor(item.code)}
                        className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50/70"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-sky-700">
                              {item.code}
                            </span>
                            <span className="rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                              {item.tag}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-900">
                            {item.name}
                          </p>
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/40 p-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Compass className="size-4 text-sky-600" />
                      <span>Xem toàn bộ 435 ngành trong danh mục Bộ GD&ĐT:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        navigate("/dashboard")
                      }}
                      className="font-bold text-sky-700 hover:underline"
                    >
                      Đến Dashboard →
                    </button>
                  </div>
                </div>
              )}

              {/* Danh sách kết quả tìm kiếm */}
              {query.trim() && filteredMajors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-400 px-1 pb-1">
                    Tìm thấy {filteredMajors.length} ngành phù hợp (Dùng phím ↑ ↓ để duyệt)
                  </div>
                  {filteredMajors.map((major, idx) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={major.major_code}
                        type="button"
                        onClick={() => handleSelectMajor(major.major_code)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex w-full items-center justify-between rounded-2xl p-3 text-left transition ${
                          isSelected
                            ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-mono text-xs font-extrabold ${
                                isSelected ? "text-sky-100" : "text-sky-600"
                              }`}
                            >
                              {major.major_code}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isSelected
                                  ? "bg-sky-400/40 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {major.category}
                            </span>
                          </div>
                          <p
                            className={`mt-1 text-sm sm:text-base font-bold ${
                              isSelected ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {major.name_vi}
                          </p>
                          <div
                            className={`mt-1 text-xs ${
                              isSelected ? "text-sky-100" : "text-slate-500"
                            }`}
                          >
                            Tổ hợp: {(major.subject_blocks || []).join(", ")}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isSelected && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-sky-100">
                              <CornerDownLeft className="size-3" /> Chọn
                            </span>
                          )}
                          <ArrowRight
                            className={`size-4 transition ${
                              isSelected
                                ? "translate-x-1 text-white"
                                : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Không có kết quả */}
              {query.trim() && filteredMajors.length === 0 && (
                <div className="py-10 text-center">
                  <BookOpen className="mx-auto size-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">
                    Không tìm thấy ngành học nào khớp với "{query}"
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Thử tìm với từ khóa chung hơn như "kinh tế", "công nghệ", "y học", hoặc mã ngành 7 số.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Toolbar */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-6 text-[11px] font-semibold text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">↑</kbd>
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">↓</kbd>
                  di chuyển
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5">↵</kbd>
                  chọn ngành
                </span>
              </div>
              <span className="hidden sm:inline">Tra cứu 435 ngành chuẩn TT74 Bộ GD&ĐT</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
