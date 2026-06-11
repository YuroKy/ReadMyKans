import { computed, type Ref } from 'vue'
import { useKanaStats } from './useKanaStats'
import { useSrsSchedule } from './useSrsSchedule'
import { buildKanaSets } from '../utils/kanaSets'
import { VOCABULARY } from '../data/vocabulary'
import { orderByUrgency } from '../data/wordSources'
import { orderBySrs, todayString } from '../utils/srs'
import { clusterFor, ALL_CLUSTER_KANA } from '../utils/minimalPairs'

export const DRILL_MODE_TEXT = 'text'

// «Словесні» джерела подають слова через повноширинний пробіл — дека форсує
// картку «ціле слово» і показує переклад у фідбеку.
const WORD_MODES = new Set(['vocab', 'numbers', 'custom', 'kanji'])
export const isWordSource = (mode: string): boolean => WORD_MODES.has(mode)

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
      return orderByUrgency(VOCABULARY, stats.value, schedule.value)
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

    // «Кат»: твої плутанини + всі члени їхніх кластерів мінімальних пар.
    // Без статистики — всі куровані кластери, щоб режим працював «з холоду».
    if (current === 'executioner') {
      const involved = new Set<string>()
      for (const [kana, stat] of Object.entries(stats.value)) {
        const partners = Object.keys(stat.confusedWith)
        if (partners.length === 0) continue
        involved.add(kana)
        for (const partner of partners) involved.add(partner)
        for (const member of clusterFor(kana)) involved.add(member)
        for (const partner of partners) {
          for (const member of clusterFor(partner)) involved.add(member)
        }
      }
      const pool = involved.size > 0 ? [...involved] : [...ALL_CLUSTER_KANA]
      return order(pool)
    }

    const set = setById.get(current)
    if (set) return order([...set.kana])
    return null
  })

  return { sets, effectiveKana }
}
