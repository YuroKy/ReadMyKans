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
