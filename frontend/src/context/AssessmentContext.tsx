import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { AssessmentState } from "../types/assessment"
import { readStorage, writeStorage } from "../services/storage"

const initial: AssessmentState = {
  step: 1,
  answers: {},
  cognitive: {},
  scores: [],
  completed: false,
}

interface AssessmentContextValue {
  assessment: AssessmentState
  update: (changes: Partial<AssessmentState>) => void
  reset: () => void
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [assessment, setAssessment] = useState<AssessmentState>(() =>
    readStorage("career-guide:assessment", initial),
  )
  const update = (changes: Partial<AssessmentState>) =>
    setAssessment((current) => {
      const next = { ...current, ...changes }
      writeStorage("career-guide:assessment", next)
      return next
    })
  const reset = () => {
    setAssessment(initial)
    writeStorage("career-guide:assessment", initial)
  }
  const value = useMemo(() => ({ assessment, update, reset }), [assessment])
  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const context = useContext(AssessmentContext)
  if (!context)
    throw new Error("useAssessment must be used within AssessmentProvider")
  return context
}
