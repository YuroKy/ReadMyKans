import { computed, type Ref } from 'vue'
import { useKanaStats } from './useKanaStats'
import { buildKanaSets } from '../utils/kanaSets'
import { orderBySrs } from '../utils/srs'

export const DRILL_MODE_TEXT = 'text'

// Resolves the kana to drill from a selected mode. Returns `null` for the
// «text» mode (the caller should use the raw source text) and a kana string
// (ordered weakest-first via SRS) for every targeted mode/set.
export const useDrillSource = (mode: Ref<string>) => {
  const { stats, weak } = useKanaStats()
  const sets = buildKanaSets()
  const setById = new Map(sets.map((set) => [set.id, set]))

  const effectiveKana = computed<string | null>(() => {
    const current = mode.value
    if (current === DRILL_MODE_TEXT) return null

    if (current === 'weak') {
      return orderBySrs(
        weak().map((entry) => entry.kana),
        stats.value,
      ).join('')
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
      return orderBySrs([...involved], stats.value).join('')
    }

    const set = setById.get(current)
    if (set) return orderBySrs([...set.kana], stats.value).join('')
    return null
  })

  return { sets, effectiveKana }
}
