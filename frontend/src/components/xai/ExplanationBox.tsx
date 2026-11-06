import { Lightbulb } from "lucide-react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function ExplanationBox({ content }: { content: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-sky-800">
        <Lightbulb size={18} />
        Giải thích từ AI
      </div>
      <div className="markdown text-sm leading-7 text-slate-700">
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      </div>
    </div>
  )
}
