import { ref } from 'vue'

export interface KanaStat {
  correct: number
  wrong: number

  confusedWith: Record<string, number>
}

export type KanaStatsMap = Record<string, KanaStat>

export const emptyStat = (): KanaStat => ({ correct: 0, wrong: 0, confusedWith: {} })

export const recordOutcome = (
  map: KanaStatsMap,
  kana: string,
  correct: boolean,
  confused?: string,
): KanaStatsMap => {
  const prev = map[kana] ?? emptyStat()
  const stat: KanaStat = {
    correct: prev.correct + (correct ? 1 : 0),
    wrong: prev.wrong + (correct ? 0 : 1),
    confusedWith: { ...prev.confusedWith },
  }
  if (!correct && confused && confused !== kana) {
    stat.confusedWith[confused] = (stat.confusedWith[confused] ?? 0) + 1
  }
  return { ...map, [kana]: stat }
}

export const topConfusion = (stat: KanaStat | undefined): string => {
  if (!stat) return ''
  let best = ''
  let max = 0
  for (const [k, n] of Object.entries(stat.confusedWith)) {
    if (n > max) {
      max = n
      best = k
    }
  }
  return best
}

export const isWeak = (stat: KanaStat | undefined): boolean => {
  if (!stat) return false
  const total = stat.correct + stat.wrong
  return stat.wrong >= 2 && stat.wrong / Math.max(total, 1) >= 0.34
}

export const rankWeak = (
  map: KanaStatsMap,
): Array<{ kana: string; wrong: number; correct: number }> =>
  Object.entries(map)
    .filter(([, s]) => s.wrong > 0)
    .map(([kana, s]) => ({ kana, wrong: s.wrong, correct: s.correct }))
    .sort((a, b) => b.wrong - a.wrong || a.kana.localeCompare(b.kana, 'ja'))

const KEY = 'kana-stats'

const load = (): KanaStatsMap => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as KanaStatsMap
  } catch {
    return {}
  }
}

const stats = ref<KanaStatsMap>(load())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(stats.value))
}

export const useKanaStats = () => {
  const record = (kana: string, correct: boolean, confused?: string) => {
    stats.value = recordOutcome(stats.value, kana, correct, confused)
    persist()
  }
  const statFor = (kana: string): KanaStat => stats.value[kana] ?? emptyStat()
  const weak = () => rankWeak(stats.value)
  const reset = () => {
    stats.value = {}
    persist()
  }
  return { stats, record, statFor, weak, reset }
}
