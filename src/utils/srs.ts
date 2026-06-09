export interface SrsStat {
  correct: number
  wrong: number
}

// Box level 0 (struggling) … 5 (mastered), derived purely from drill stats.
export const boxLevel = (stat: SrsStat | undefined): number => {
  if (!stat) return 0
  return Math.max(0, Math.min(5, stat.correct - stat.wrong * 2))
}

// Higher = more in need of practice. Untouched kana sit in the middle, so a
// brand-new kana is drilled before well-known ones but after clearly weak ones.
export const srsPriority = (stat: SrsStat | undefined): number => {
  if (!stat) return 3
  const total = stat.correct + stat.wrong
  if (total === 0) return 3
  return (stat.wrong / total) * 10 + Math.min(stat.wrong, 5)
}

// Most-due / weakest kana first; stable for equal priorities.
export const orderBySrs = (kana: string[], stats: Record<string, SrsStat>): string[] =>
  [...kana].sort((a, b) => srsPriority(stats[b]) - srsPriority(stats[a]))
