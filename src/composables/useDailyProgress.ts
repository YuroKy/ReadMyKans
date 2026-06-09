import { computed, ref } from 'vue'
import { useActivityLog } from './useActivityLog'

export interface DailyState {
  date: string // YYYY-MM-DD
  count: number // learning actions done today
  goal: number // target actions per day
}

export const DEFAULT_GOAL = 20
const KEY = 'kana-daily'

export const emptyDaily = (): DailyState => ({ date: '', count: 0, goal: DEFAULT_GOAL })

const todayString = (): string => new Date().toISOString().slice(0, 10)

// Pure: a new day zeroes the count but keeps the chosen goal.
export const rollDay = (prev: DailyState, today: string): DailyState =>
  prev.date === today ? prev : { date: today, count: 0, goal: prev.goal }

export const addToday = (prev: DailyState, today: string, n = 1): DailyState => {
  const rolled = rollDay(prev, today)
  return { ...rolled, count: rolled.count + n }
}

export const setGoal = (prev: DailyState, goal: number): DailyState => ({
  ...prev,
  goal: Math.max(1, Math.floor(goal)),
})

const read = (): DailyState => {
  if (typeof window === 'undefined') return emptyDaily()
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...emptyDaily(), ...(JSON.parse(raw) as Partial<DailyState>) } : emptyDaily()
  } catch {
    return emptyDaily()
  }
}

// Module-level singleton (same pattern as useStreak / useKanaStats).
const state = ref<DailyState>(read())

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state.value))
}

export const useDailyProgress = () => {
  const { recordToday } = useActivityLog()

  // Reading these reflects the live day, so the ring resets at midnight without
  // a reload once any activity happens.
  const today = computed(() => rollDay(state.value, todayString()))
  const count = computed(() => today.value.count)
  const goal = computed(() => today.value.goal)
  const reached = computed(() => count.value >= goal.value)
  const percent = computed(() =>
    goal.value === 0 ? 0 : Math.min(100, Math.round((count.value / goal.value) * 100)),
  )

  // Records `n` learning actions. Returns true if this call crosses the goal
  // (so the caller can celebrate exactly once).
  const add = (n = 1): boolean => {
    const before = rollDay(state.value, todayString())
    const wasReached = before.count >= before.goal
    state.value = addToday(state.value, todayString(), n)
    persist()
    recordToday(n) // keep the long-term activity history in sync
    return !wasReached && state.value.count >= state.value.goal
  }

  const updateGoal = (next: number) => {
    state.value = setGoal(rollDay(state.value, todayString()), next)
    persist()
  }

  return { state, count, goal, reached, percent, add, updateGoal }
}
