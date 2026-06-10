import { ref } from 'vue'
import { dueKana, nextCard, todayString, type SrsMap } from '../utils/srs'

const KEY = 'kana-srs'

const load = (): SrsMap => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as SrsMap
  } catch {
    return {}
  }
}

// Module-level singleton so every component shares one schedule (same pattern
// as useKanaStats / useStreak).
const schedule = ref<SrsMap>(load())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(schedule.value))
}

export const useSrsSchedule = () => {
  const record = (kana: string, correct: boolean) => {
    const today = todayString()
    schedule.value = { ...schedule.value, [kana]: nextCard(schedule.value[kana], correct, today) }
    persist()
  }

  const due = (universe: string[], cap?: number): string[] =>
    dueKana(schedule.value, universe, todayString(), cap)

  const dueCount = (universe: string[], cap?: number): number => due(universe, cap).length

  return { schedule, record, due, dueCount }
}
