import { useKanaStats } from './useKanaStats'
import { useStreak } from './useStreak'
import { useBestScores } from './useBestScores'
import { useFormatsSeen } from './useFormatsSeen'
import { masterySummary } from '../utils/kanaMastery'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import type { ProgressSnapshot } from '../utils/achievements'
import type { HistoryItem } from '../types'

const HIRA = HIRAGANA_ROWS.flat().filter(Boolean)
const KATA = KATAKANA_ROWS.flat().filter(Boolean)

// Read the best accuracy across stored sessions straight from localStorage so we
// don't depend on a particular useSessionHistory instance being in scope.
const readBestSessionAccuracy = (): number => {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem('kana-reader-history')
    if (!raw) return 0
    const items = JSON.parse(raw) as HistoryItem[]
    return Array.isArray(items) ? items.reduce((max, it) => Math.max(max, it.accuracy ?? 0), 0) : 0
  } catch {
    return 0
  }
}

// Assembles the current progress snapshot for achievement evaluation. Returns a
// `build()` function rather than a computed because it reads live singleton
// stores plus localStorage at the moment of a session/game boundary.
export const useProgressSnapshot = () => {
  const { stats } = useKanaStats()
  const { state: streak } = useStreak()
  const { scores } = useBestScores()
  const { seen } = useFormatsSeen()

  const build = (): ProgressSnapshot => {
    let totalAnswered = 0
    let totalCorrect = 0
    for (const stat of Object.values(stats.value)) {
      totalAnswered += stat.correct + stat.wrong
      totalCorrect += stat.correct
    }

    // Sudden-death streaks live under their own key and must not count toward
    // the time-attack achievement — an untimed streak is a different sport.
    let bestSprint = 0
    for (const [key, value] of Object.entries(scores.value)) {
      if (key.startsWith('sprint:') && key !== 'sprint:suddendeath') {
        bestSprint = Math.max(bestSprint, value)
      }
    }

    return {
      totalAnswered,
      totalCorrect,
      bestSessionAccuracy: readBestSessionAccuracy(),
      streak: streak.value.streak,
      hiraganaMasteredPct: masterySummary(stats.value, HIRA).masteredPct,
      katakanaMasteredPct: masterySummary(stats.value, KATA).masteredPct,
      bestSprint,
      bestSuddenDeath: scores.value['sprint:suddendeath'] ?? 0,
      bestDrillCombo: scores.value['drill:combo'] ?? 0,
      formatsSeen: seen.value,
    }
  }

  return { build }
}
