import { summarizeAssessmentAttempt } from "../utils/assessmentEvidence"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { readStorage, writeStorage } from "../services/storage"
import type {
  AssessmentHistoryItem,
  AssessmentState,
} from "../types/assessment"
import { useAuth } from "./AuthContext"

const initial: AssessmentState = {
  step: 1,
  answers: {},
  cognitive: {},
  scores: [],
  completed: false,
}

interface AssessmentContextValue {
  assessment: AssessmentState
  history: AssessmentHistoryItem[]
  activeHistoryId: string | null
  update: (changes: Partial<AssessmentState>) => void
  reset: () => void
  recordCompletedAttempt: (state: AssessmentState) => AssessmentHistoryItem
  selectHistoryAttempt: (id: string) => void
  deleteHistoryAttempt: (id: string) => void
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return <ScopedAssessmentProvider key={user?.id || "guest"}>{children}</ScopedAssessmentProvider>
}

function ScopedAssessmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userKey = useMemo(
    () => (user?.email || user?.id || "guest").toLowerCase().trim(),
    [user?.email, user?.id],
  )

  const assessmentStorageKey = `career-guide:assessment:${userKey}`
  const historyStorageKey = `career-guide:assessment-history:${userKey}`

  const [history, setHistory] = useState<AssessmentHistoryItem[]>(() =>
    readStorage<AssessmentHistoryItem[]>(historyStorageKey, []),
  )
  const [assessment, setAssessment] = useState<AssessmentState>(() => {
    const stored = readStorage<AssessmentState | null>(assessmentStorageKey, null)
    return stored ?? initial
  })
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === assessmentStorageKey) { setAssessment(readStorage<AssessmentState>(assessmentStorageKey, initial)); setActiveHistoryId(null) }
      if (event.key === historyStorageKey) setHistory(readStorage<AssessmentHistoryItem[]>(historyStorageKey, []))
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [assessmentStorageKey, historyStorageKey])

  const update = useCallback(
    (changes: Partial<AssessmentState>) => {
      setAssessment((current) => {
        const next = { ...current, ...changes }
        writeStorage(assessmentStorageKey, next)
        return next
      })
    },
    [assessmentStorageKey],
  )

  const reset = useCallback(() => {
    setAssessment(initial)
    setActiveHistoryId(null)
    writeStorage(assessmentStorageKey, initial)
  }, [assessmentStorageKey])

  const recordCompletedAttempt = useCallback(
    (state: AssessmentState): AssessmentHistoryItem => {
      const nowIso = new Date().toISOString()
      const completedState: AssessmentState = {
        ...state,
        completed: true,
        completedAt: nowIso,
      }
      setAssessment(completedState)
      writeStorage(assessmentStorageKey, completedState)

      const summary = summarizeAssessmentAttempt(
        completedState.answers,
        completedState.cognitive,
        completedState.scores,
      )
      const newItem: AssessmentHistoryItem = {
        id: `attempt-${Date.now()}`,
        createdAt: nowIso,
        ...summary,
        aspiration: completedState.aspiration
          ? { ...completedState.aspiration }
          : undefined,
      }

      setHistory((prev) => {
        const nextHistory = [newItem, ...prev]
        writeStorage(historyStorageKey, nextHistory)
        return nextHistory
      })
      setActiveHistoryId(newItem.id)
      return newItem
    },
    [assessmentStorageKey, historyStorageKey],
  )

  const selectHistoryAttempt = useCallback(
    (id: string) => {
      const found = history.find((item) => item.id === id)
      if (!found) return
      const restored: AssessmentState = {
        step: 4,
        answers: { ...found.answers },
        cognitive: { ...found.cognitive },
        scores: [...found.scores],
        aspiration: found.aspiration ? { ...found.aspiration } : undefined,
        completed: true,
        completedAt: found.createdAt,
      }
      setAssessment(restored)
      writeStorage(assessmentStorageKey, restored)
      setActiveHistoryId(found.id)
    },
    [history, assessmentStorageKey],
  )

  const deleteHistoryAttempt = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const nextHistory = prev.filter((item) => item.id !== id)
        writeStorage(historyStorageKey, nextHistory)

        if (nextHistory.length === 0) {
          setAssessment(initial)
          writeStorage(assessmentStorageKey, initial)
          setActiveHistoryId(null)
        } else if (activeHistoryId === id) {
          setAssessment(initial)
          writeStorage(assessmentStorageKey, initial)
          setActiveHistoryId(null)
        }
        return nextHistory
      })
    },
    [activeHistoryId, assessmentStorageKey, historyStorageKey],
  )

  const value = useMemo(
    () => ({
      assessment,
      history,
      activeHistoryId,
      update,
      reset,
      recordCompletedAttempt,
      selectHistoryAttempt,
      deleteHistoryAttempt,
    }),
    [
      assessment,
      history,
      activeHistoryId,
      update,
      reset,
      recordCompletedAttempt,
      selectHistoryAttempt,
      deleteHistoryAttempt,
    ],
  )

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
