export type MasteryTier = 'mastered' | 'learning' | 'weak' | 'untouched'

export interface MasteryStat {
  correct: number
  wrong: number
}

export const classifyMastery = (stat: MasteryStat | undefined): MasteryTier => {
  if (!stat) return 'untouched'

  const total = stat.correct + stat.wrong
  if (total === 0) return 'untouched'
  if (stat.wrong >= 2 && stat.wrong / total >= 0.34) return 'weak'
  if (total >= 3 && stat.correct / total >= 0.85) return 'mastered'
  return 'learning'
}

export const masteryLabel: Record<MasteryTier, string> = {
  mastered: 'Засвоєно',
  learning: 'Вчиться',
  weak: 'Слабка',
  untouched: 'Не практикувалась',
}

export const MASTERY_TIERS: MasteryTier[] = ['mastered', 'learning', 'weak', 'untouched']

export interface MasterySummary {
  mastered: number
  learning: number
  weak: number
  untouched: number
  total: number
  masteredPct: number
}

// Counts how many of `allKana` fall into each mastery tier, plus the share that
// is fully mastered. `allKana` is the universe to report on (e.g. the gojūon
// grid), so untouched kana are counted too.
export const masterySummary = (
  stats: Record<string, MasteryStat>,
  allKana: string[],
): MasterySummary => {
  const counts: Record<MasteryTier, number> = { mastered: 0, learning: 0, weak: 0, untouched: 0 }
  for (const kana of allKana) {
    counts[classifyMastery(stats[kana])] += 1
  }
  const total = allKana.length
  return {
    ...counts,
    total,
    masteredPct: total === 0 ? 0 : Math.round((counts.mastered / total) * 100),
  }
}
