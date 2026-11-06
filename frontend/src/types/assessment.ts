export type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C"

export interface AcademicScore {
  subject: string
  score: number
  zScore: number
}

export interface AssessmentState {
  step: number
  answers: Record<string, number>
  cognitive: Record<string, string | number>
  scores: AcademicScore[]
  completed: boolean
}
