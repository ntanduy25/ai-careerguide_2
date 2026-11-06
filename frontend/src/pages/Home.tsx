import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  ChevronRight,
  Compass,
  Database,
  Eye,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { Link } from "react-router"
import { useEffect, useState } from "react"
import { Button } from "../components/common/Button"
import { Card } from "../components/common/Card"
import { PageContainer } from "../components/layout/PageContainer"

const pillars = [
  {
    icon: Compass,
    label: "Sở thích nghề nghiệp",
    title: "Holland RIASEC",
    text: "Khám phá 6 nhóm tính cách nghề nghiệp qua bộ câu hỏi đã chuẩn hóa.",
    color: "indigo",
  },
  {
    icon: BarChart3,
    label: "Năng lực học tập",
    title: "Z-Score học lực",
    text: "Đặt điểm số vào đúng bối cảnh để nhận diện lợi thế theo tổ hợp môn.",
    color: "emerald",
  },
  {
    icon: Brain,
    label: "Cách bạn tư duy",
    title: "Phong cách nhận thức",
    text: "Hiểu cách học, làm việc và giải quyết vấn đề phù hợp nhất với bạn.",
    color: "amber",
  },
]

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1598981457915-aea220950616?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
    alt: "Học sinh đang tập trung học tập trong lớp",
    label: "Khám phá năng lực",
  },
  {
    src: "https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
    alt: "Nhóm sinh viên cùng trao đổi bên máy tính",
    label: "Kết nối trải nghiệm",
  },
  {
    src: "https://images.unsplash.com/photo-1782388713336-fcb8aa6db8f0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1200",
    alt: "Sinh viên hợp tác trong dự án công nghệ",
    label: "Kiến tạo tương lai",
  },
]

export function Home() {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveImage((current) => (current + 1) % heroImages.length),
      4500,
    )
    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <section className="relative overflow-hidden bg-transparent pb-18 pt-12 sm:pt-18 lg:pb-24">
        <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-100/60 blur-3xl" />
        <PageContainer className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
              <Sparkles size={14} />
              Hướng nghiệp khoa học · Quyết định có căn cứ
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[64px]">
              Không chỉ chọn ngành.
              <br />
              <span className="text-sky-600">Chọn đúng tương lai.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              AI CareerGuide giúp học sinh lớp 11–12 kết nối sở thích, học lực
              và phong cách tư duy để tìm ra ngành học phù hợp — với mọi gợi ý
              đều được giải thích minh bạch.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/assessment">
                <Button className="w-full sm:w-auto" icon={ArrowRight}>
                  Bắt đầu đánh giá miễn phí
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  icon={Eye}
                >
                  Xem kết quả mẫu
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              {[
                "10–12 phút",
                "Không có đáp án đúng sai",
                "Bảo mật dữ liệu",
              ].map((item) => (
                <span className="flex items-center gap-1.5" key={item}>
                  <Check size={14} className="text-emerald-600" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="relative"
          >
            <div className="absolute -inset-5 rotate-2 rounded-[36px] bg-sky-100" />
            <div className="relative h-[450px] overflow-hidden rounded-[30px] border-8 border-white/75 bg-slate-900 shadow-2xl backdrop-blur-xl">
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={heroImages[activeImage].src}
                  src={heroImages[activeImage].src}
                  alt={heroImages[activeImage].alt}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 0.82, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    opacity: { duration: 0.8 },
                    scale: { duration: 4.5 },
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-slate-950/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-xl">
                {heroImages[activeImage].label}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-200">
                  Dữ liệu ngành học chính thống
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-black">435</span>
                    <span className="ml-2 text-sm text-slate-300">
                      ngành đào tạo
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-xs backdrop-blur">
                    <b className="block">TT 09 & TT 74</b>
                    <span className="text-slate-300">Bộ GD&ĐT</span>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  {heroImages.map((image, index) => (
                    <button
                      key={image.src}
                      onClick={() => setActiveImage(index)}
                      aria-label={`Xem ảnh ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === index
                          ? "w-8 bg-white"
                          : "w-2 bg-white/35 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-panel absolute -left-6 top-10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Target size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Độ phù hợp
                  </p>
                  <p className="font-black text-slate-900">94% MATCH</p>
                </div>
              </div>
            </div>
          </motion.div>
        </PageContainer>
      </section>

      <section
        id="about"
        className="border-y border-sky-100/80 bg-sky-50/35 py-20 backdrop-blur-sm"
      >
        <PageContainer>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-sky-600">
              Ba lớp dữ liệu, một chân dung
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Hiểu đúng mình trước khi chọn ngành
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Không dựa vào một bài test đơn lẻ. Mô hình kết hợp nhiều tín hiệu
              để đưa ra góc nhìn cân bằng.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((item, index) => (
              <Card
                key={item.title}
                className="group p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  className={`grid size-12 place-items-center rounded-2xl ${
                    index === 0
                      ? "bg-sky-100 text-sky-700"
                      : index === 1
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <item.icon size={23} />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                  {item.label}
                </p>
                <h3 className="mt-2 text-xl font-extrabold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
                <Link
                  to="/assessment"
                  className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800"
                >
                  Bắt đầu trải nghiệm <ChevronRight size={14} />
                </Link>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="mx-4 my-8 rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-100/75 via-blue-50/65 to-cyan-100/70 py-18 text-slate-900 shadow-[0_12px_40px_rgba(14,165,233,0.12)] backdrop-blur-2xl">
        <PageContainer className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/60 bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-700">
              <ShieldCheck size={14} />
              Explainable AI
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              AI đưa ra gợi ý.
              <br />
              Bạn luôn là người quyết định.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Mỗi đề xuất đều đi kèm lý do, trọng số và khoảng trống kỹ năng.
              Không hộp đen, không áp đặt, không đánh đổi quyền tự chủ.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Dữ liệu có nguồn", Database],
              ["Giải thích từng điểm số", Eye],
              ["Lộ trình hành động", BookOpenCheck],
              ["435 ngành chuẩn hóa", GraduationCap],
            ].map(([label, Icon]) => (
              <div
                key={String(label)}
                className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/65 p-4 text-slate-800 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/85"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-sky-100 text-sky-600">
                  <Icon size={19} />
                </span>
                <span className="text-sm font-bold">{String(label)}</span>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  )
}
