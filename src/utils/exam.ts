// Тижневий екзамен: 50 кан, формати впереміш, без підказок і пропусків,
// одна спроба на ISO-тиждень. Чиста логіка — добір білетів і календар тижнів.

import { orderBySrs, todayString, type SrsMap, type SrsStat } from './srs'

export const EXAM_SIZE = 50
export const PASS_PCT = 90

export type ExamFormat = 'recognition' | 'dictation' | 'choice'

export interface ExamItem {
  kana: string
  format: ExamFormat
}

export interface ExamRecord {
  week: string // '2026-W24'
  date: string // ISO
  correct: number
  total: number
  accuracy: number // 0..100
  passed: boolean
}

// ISO 8601-тиждень (понеділок — перший день, тиждень №1 містить перший четвер).
export const isoWeek = (date: Date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

const FORMATS: ExamFormat[] = ['recognition', 'dictation', 'choice']

// 50 білетів: найпріоритетніші за SRS кани, перемішані, формати по колу.
// `allowDictation=false` (немає TTS) замінює диктант на розпізнавання.
export const buildExam = (
  universe: string[],
  stats: Record<string, SrsStat>,
  schedule: SrsMap,
  today: string = todayString(),
  random: () => number = Math.random,
  allowDictation = true,
): ExamItem[] => {
  const picked = orderBySrs(universe, stats, schedule, today).slice(0, EXAM_SIZE)
  // Fisher–Yates: порядок не повинен видавати пріоритет (найслабші першими).
  for (let i = picked.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[picked[i], picked[j]] = [picked[j]!, picked[i]!]
  }
  return picked.map((kana, i) => {
    const format = FORMATS[i % FORMATS.length]!
    return { kana, format: format === 'dictation' && !allowDictation ? 'recognition' : format }
  })
}

export const attemptedThisWeek = (history: ExamRecord[], week: string): boolean =>
  history.some((record) => record.week === week)
