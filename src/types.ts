export type SessionStatus = 'idle' | 'listening' | 'paused' | 'finished' | 'error'

export type AppView = 'setup' | 'reading' | 'result' | 'drill' | 'sprint' | 'memory'

export interface UploadedFileInfo {
  name: string
  size: number
  characterCount: number
}

export interface KanaFrequency {
  kana: string
  count: number
}

export interface KanaAnalysis {
  hiraganaCount: number
  katakanaCount: number
  uniqueKana: string[]
  mostFrequentKana: KanaFrequency[]
}

export type ComparisonSegmentType = 'correct' | 'missed' | 'extra' | 'mismatch'

export interface ComparisonSegment {
  type: ComparisonSegmentType
  original?: string
  spoken?: string
}

export interface ComparisonResult {
  normalizedOriginal: string
  normalizedSpoken: string
  distance: number
  similarity: number
  mismatchCount: number
  segments: ComparisonSegment[]
  kanaToReview: string[]
}

export interface SessionResult {
  id: string
  date: string
  originalText: string
  recognizedText: string
  accuracy: number
  originalLength: number
  recognizedLength: number
  mismatchCount: number
  kanaToReview: string[]
  durationMs: number
  comparison: ComparisonResult
}

export interface HistoryItem {
  id: string
  date: string
  preview: string
  accuracy: number
  durationMs: number
  kanaToReview: string[]
}

export interface SpeechRecognitionAlternativeLike {
  transcript: string
  confidence?: number
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeLike
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives?: number
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}
