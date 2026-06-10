import { ref } from 'vue'

export interface StreakState {
  lastDate: string // YYYY-MM-DD
  streak: number
  todayCount: number
  freezes: number // зароблені заморозки (рятують стрік від пропуску дня)
}

export type StreakEvent = 'same' | 'started' | 'extended' | 'frozen' | 'burned'

export interface StreakAdvance {
  state: StreakState
  event: StreakEvent
  lost: number // скільки днів стріку згоріло (для драматичного тосту)
}

const KEY = 'kana-streak'
export const MAX_FREEZES = 2

export const emptyStreak = (): StreakState => ({
  lastDate: '',
  streak: 0,
  todayCount: 0,
  freezes: 0,
})

const dayDiff = (from: string, to: string): number => {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity
  return Math.round((b - a) / 86_400_000)
}

// Pure transition. Same day bumps today's count; the next consecutive day
// extends the streak. A gap of g missed days survives if there are g freezes
// to burn (they are consumed); otherwise the streak burns down to 1 and the
// caller gets to rub it in.
export const advanceStreak = (prev: StreakState, today: string): StreakAdvance => {
  if (prev.lastDate === today) {
    return { state: { ...prev, todayCount: prev.todayCount + 1 }, event: 'same', lost: 0 }
  }

  const diff = dayDiff(prev.lastDate, today)
  if (diff === 1) {
    return {
      state: { ...prev, lastDate: today, streak: prev.streak + 1, todayCount: 1 },
      event: 'extended',
      lost: 0,
    }
  }

  if (prev.lastDate === '' || prev.streak === 0) {
    return {
      state: { ...prev, lastDate: today, streak: 1, todayCount: 1 },
      event: 'started',
      lost: 0,
    }
  }

  const missed = Number.isFinite(diff) ? Math.max(0, diff - 1) : Infinity
  if (missed > 0 && prev.freezes >= missed) {
    return {
      state: {
        lastDate: today,
        streak: prev.streak + 1,
        todayCount: 1,
        freezes: prev.freezes - missed,
      },
      event: 'frozen',
      lost: 0,
    }
  }

  // Заморозок забракло — але й не спалюємо їх дарма.
  return {
    state: { ...prev, lastDate: today, streak: 1, todayCount: 1 },
    event: 'burned',
    lost: prev.streak,
  }
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

const persist = () => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(state.value))
}

export const useStreak = () => {
  const recordActivity = (): StreakAdvance => {
    const advance = advanceStreak(state.value, todayString())
    state.value = advance.state
    persist()
    return advance
  }

  // Заморозка заробляється бездоганною сесією; повертає false на капі.
  const grantFreeze = (): boolean => {
    if (state.value.freezes >= MAX_FREEZES) return false
    state.value = { ...state.value, freezes: state.value.freezes + 1 }
    persist()
    return true
  }

  return { state, recordActivity, grantFreeze }
}
