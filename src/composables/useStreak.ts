import { ref } from 'vue'

export interface StreakState {
  lastDate: string // YYYY-MM-DD
  streak: number
  todayCount: number
}

const KEY = 'kana-streak'

export const emptyStreak = (): StreakState => ({ lastDate: '', streak: 0, todayCount: 0 })

const dayDiff = (from: string, to: string): number => {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity
  return Math.round((b - a) / 86_400_000)
}

// Pure transition: same day bumps today's count; the next consecutive day
// extends the streak; any gap (or first ever) resets it to 1.
export const advanceStreak = (prev: StreakState, today: string): StreakState => {
  if (prev.lastDate === today) {
    return { ...prev, todayCount: prev.todayCount + 1 }
  }
  const streak = dayDiff(prev.lastDate, today) === 1 ? prev.streak + 1 : 1
  return { lastDate: today, streak, todayCount: 1 }
}

const todayString = (): string => new Date().toISOString().slice(0, 10)

const read = (): StreakState => {
  if (typeof window === 'undefined') return emptyStreak()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...emptyStreak(), ...(JSON.parse(raw) as Partial<StreakState>) } : emptyStreak()
  } catch {
    return emptyStreak()
  }
}

const state = ref<StreakState>(read())

export const useStreak = () => {
  const recordActivity = () => {
    state.value = advanceStreak(state.value, todayString())
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state.value))
  }

  return { state, recordActivity }
}
