import { BrainCircuit } from "lucide-react"
import { PageContainer } from "./PageContainer"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <PageContainer className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2 font-extrabold text-slate-900">
          <BrainCircuit size={20} className="text-sky-600" />
          AI CareerGuide
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Gợi ý mang tính tham khảo, được giải thích minh bạch để học sinh và
          phụ huynh cùng ra quyết định.
        </p>
        <p className="text-xs font-medium text-slate-400">
          © 2026 AI CareerGuide
        </p>
      </PageContainer>
    </footer>
  )
}
