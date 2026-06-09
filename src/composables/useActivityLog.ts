import { ref } from 'vue'

// Per-day learning counts (date → number of answers), powering the activity
// heatmap. Bumped from useDailyProgress so every learning action is logged once,
// while past days are kept for history (unlike the single-day daily counter).

export type ActivityMap = Record<string, number>
const KEY = 'kana-activity'

const todayString = (): string => new Date().toISOString().slice(0, 10)

const read = (): ActivityMap => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as ActivityMap
  } catch {
    return {}
  }
}

const log = ref<ActivityMap>(read())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(log.value))
}

export const useActivityLog = () => {
  const recordToday = (n = 1) => {
    const today = todayString()
    log.value = { ...log.value, [today]: (log.value[today] ?? 0) + n }
    persist()
  }

  return { log, recordToday }
}
