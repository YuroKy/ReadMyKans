import { computed, type Ref } from 'vue'
import { useKanaStats } from './useKanaStats'
import { useSrsSchedule } from './useSrsSchedule'
import { buildKanaSets } from '../utils/kanaSets'
import { VOCABULARY } from '../data/vocabulary'
import { orderBySrs, reviewPriority, todayString } from '../utils/srs'

export const DRILL_MODE_TEXT = 'text'

// Resolves the kana to drill from a selected mode. Returns `null` for the
// «text» mode (the caller should use the raw source text) and a kana string
// (ordered most-due/weakest-first via the combined SRS priority) for every
// targeted mode/set.
export const useDrillSource = (mode: Ref<string>) => {
  const { stats, weak } = useKanaStats()
  const { schedule } = useSrsSchedule()
  const sets = buildKanaSets()
  const setById = new Map(sets.map((set) => [set.id, set]))

  const order = (kana: string[]): string =>
    orderBySrs(kana, stats.value, schedule.value, todayString()).join('')

  const effectiveKana = computed<string | null>(() => {
    const current = mode.value
    if (current === DRILL_MODE_TEXT) return null

    // Слова через повноширинний пробіл — чанкінг дрила ріже по словах.
    // Першими йдуть слова, чия найслабша кана найтерміновіша.
    if (current === 'vocab') {
      const today = todayString()
      const urgency = (word: string): number =>
        Math.max(
          ...[...word].map((kana) => reviewPriority(stats.value[kana], schedule.value[kana], today)),
        )
      return [...VOCABULARY]
        .sort((a, b) => urgency(b.kana) - urgency(a.kana))
        .map((entry) => entry.kana)
        .join('　')
    }

    if (current === 'weak') {
      return order(weak().map((entry) => entry.kana))
    }

    if (current === 'confusions') {
      const involved = new Set<string>()
      for (const [kana, stat] of Object.entries(stats.value)) {
        const partners = Object.keys(stat.confusedWith)
        if (partners.length > 0) {
          involved.add(kana)
          for (const partner of partners) involved.add(partner)
        }
      }
      return order([...involved])
    }

    const set = setById.get(current)
    if (set) return order([...set.kana])
    return null
  })

  return { sets, effectiveKana }
}
