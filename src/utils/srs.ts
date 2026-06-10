// Єдиний SRS-модуль: часовий розклад (Leitner-коробки з датами, ключ
// localStorage `kana-srs`) + комбінований пріоритет подачі, що поєднує
// розклад зі статистикою помилок (`kana-stats`).

// --- Розклад (Leitner) -------------------------------------------------------

export interface SrsCard {
  box: number // index into INTERVALS
  due: string // YYYY-MM-DD — next review date
}

export type SrsMap = Record<string, SrsCard>

// Days to wait per box. Box 0 is reviewed same day; higher boxes space out.
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30]

export const todayString = (date: Date = new Date()): string => date.toISOString().slice(0, 10)

const DAY_MS = 86_400_000

const addDays = (isoDate: string, days: number): string => {
  const base = Date.parse(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(base)) return isoDate
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10)
}

// Correct → advance one box (capped) and schedule by that box's interval.
// Wrong → drop back to box 0, due again today.
export const nextCard = (prev: SrsCard | undefined, correct: boolean, today: string): SrsCard => {
  if (!correct) return { box: 0, due: today }
  const prevBox = prev?.box ?? 0
  const box = Math.min(prevBox + 1, INTERVALS.length - 1)
  return { box, due: addDays(today, INTERVALS[box] ?? 0) }
}

// A scheduled card is due when its review date is today or earlier.
export const isDue = (card: SrsCard, today: string): boolean => card.due <= today

// Builds today's review queue from `universe`: overdue scheduled cards first
// (earliest due, then lowest box = weakest), then never-seen kana, capped.
export const dueKana = (map: SrsMap, universe: string[], today: string, cap = 40): string[] => {
  const reviews: Array<{ kana: string; due: string; box: number }> = []
  const fresh: string[] = []

  for (const kana of universe) {
    const card = map[kana]
    if (!card) fresh.push(kana)
    else if (isDue(card, today)) reviews.push({ kana, due: card.due, box: card.box })
  }

  reviews.sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box)

  return [...reviews.map((entry) => entry.kana), ...fresh].slice(0, cap)
}

// --- Пріоритет за статистикою помилок ----------------------------------------

export interface SrsStat {
  correct: number
  wrong: number
}

// Higher = more in need of practice. Untouched kana sit in the middle, so a
// brand-new kana is drilled before well-known ones but after clearly weak ones.
export const srsPriority = (stat: SrsStat | undefined): number => {
  if (!stat) return 3
  const total = stat.correct + stat.wrong
  if (total === 0) return 3
  return (stat.wrong / total) * 10 + Math.min(stat.wrong, 5)
}

// --- Комбінований пріоритет (розклад + статистика) ----------------------------

// Шкали: прострочені — 100+ (поза конкуренцією, що давніше і слабше — то вище),
// без розкладу — 0..15 за статистикою (нові = 3), заплановані на майбутнє —
// ≤2 («відпочивають» нижче нових, глибші бокси — нижче).
export const reviewPriority = (
  stat: SrsStat | undefined,
  card: SrsCard | undefined,
  today: string,
): number => {
  if (card) {
    if (isDue(card, today)) {
      const overdueMs = Date.parse(today) - Date.parse(card.due)
      const overdueDays = Number.isNaN(overdueMs)
        ? 0
        : Math.min(Math.max(overdueMs / DAY_MS, 0), 30)
      return 100 + overdueDays + (INTERVALS.length - 1 - card.box)
    }
    return 2 - card.box
  }
  return srsPriority(stat)
}

// Most-due / weakest kana first; stable for equal priorities.
export const orderBySrs = (
  kana: string[],
  stats: Record<string, SrsStat>,
  schedule: SrsMap = {},
  today: string = todayString(),
): string[] =>
  [...kana].sort(
    (a, b) => reviewPriority(stats[b], schedule[b], today) - reviewPriority(stats[a], schedule[a], today),
  )
