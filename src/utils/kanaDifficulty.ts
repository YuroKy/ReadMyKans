import { isKana } from './kana'

export type KanaDifficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyBreakdown {
  easy: number
  medium: number
  hard: number
  total: number
}

const toHiragana = (char: string): string => {
  const code = char.charCodeAt(0)
  return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
}

const SMALL_KANA = new Set([...'ぁぃぅぇぉゃゅょっゎ'])
const DAKUTEN = new Set([...'がぎぐげござじずぜぞだぢづでどばびぶべぼゔ'])
const HANDAKUTEN = new Set([...'ぱぴぷぺぽ'])

export const classifyKana = (char: string): KanaDifficulty | null => {
  if (!isKana(char)) return null

  const hira = toHiragana(char)

  if (SMALL_KANA.has(hira) || hira === 'ー' || HANDAKUTEN.has(hira)) return 'hard'
  if (DAKUTEN.has(hira)) return 'medium'
  return 'easy'
}

export const analyzeKanaDifficulty = (text: string): DifficultyBreakdown => {
  const breakdown: DifficultyBreakdown = { easy: 0, medium: 0, hard: 0, total: 0 }

  for (const char of text) {
    const level = classifyKana(char)
    if (!level) continue
    breakdown[level] += 1
    breakdown.total += 1
  }

  return breakdown
}
