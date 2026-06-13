export interface MorseSymbol {
  char: string
  code: string
}

export type TrainMode = 'charToCode' | 'codeToChar' | 'audioToChar' | 'typingToCode'

export type QuizType = 'char' | 'word'

export interface HistoryEntry {
  id: number
  input: string
  output: string
  correct: boolean
  timestamp: number
  quizType: QuizType
}

export interface ScoreRecord {
  correct: number
  total: number
}
