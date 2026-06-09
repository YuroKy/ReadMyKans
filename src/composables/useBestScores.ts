import { ref } from 'vue'

// Personal bests for mini-games (sprint score, memory moves/time…), keyed by an
// arbitrary string so each game/set tracks its own record.

export type BestMap = Record<string, number>
const KEY = 'kana-best'

export const isNewBest = (prev: number | undefined, score: number): boolean =>
  score > (prev ?? 0)

// Lower-is-better variant (e.g. fewest moves / fastest time).
export const isNewLow = (prev: number | undefined, score: number): boolean =>
  prev === undefined || score < prev

const read = (): BestMap => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as BestMap
  } catch {
    return {}
  }
}

const scores = ref<BestMap>(read())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(scores.value))
}

export const useBestScores = () => {
  const best = (key: string): number => scores.value[key] ?? 0

  // Records `score` if it beats the stored best. Returns true when it's a new record.
  const record = (key: string, score: number): boolean => {
    if (!isNewBest(scores.value[key], score)) return false
    scores.value = { ...scores.value, [key]: score }
    persist()
    return true
  }

  // Lower-is-better record (fewest moves / fastest time).
  const recordLow = (key: string, score: number): boolean => {
    if (!isNewLow(scores.value[key], score)) return false
    scores.value = { ...scores.value, [key]: score }
    persist()
    return true
  }

  const has = (key: string): boolean => key in scores.value

  return { scores, best, has, record, recordLow }
}
