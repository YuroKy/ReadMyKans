// Time-based spaced repetition (Leitner-style) on top of plain drill outcomes.
// Each kana gets a box (longer box = longer gap) and a `due` date; correct
// answers promote the box and push `due` further out, wrong answers reset it.

export interface SrsCard {
  box: number // index into INTERVALS
  due: string // YYYY-MM-DD — next review date
}

export type SrsMap = Record<string, SrsCard>

// Days to wait per box. Box 0 is reviewed same day; higher boxes space out.
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30]

export const todayString = (date: Date = new Date()): string => date.toISOString().slice(0, 10)

const addDays = (isoDate: string, days: number): string => {
  const base = Date.parse(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(base)) return isoDate
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10)
}

// Correct → advance one box (capped) and schedule by that box's interval.
// Wrong → drop back to box 0, due again today.
export const nextCard = (
  prev: SrsCard | undefined,
  correct: boolean,
  today: string,
): SrsCard => {
  if (!correct) return { box: 0, due: today }
  const prevBox = prev?.box ?? 0
  const box = Math.min(prevBox + 1, INTERVALS.length - 1)
  return { box, due: addDays(today, INTERVALS[box] ?? 0) }
}

// A scheduled card is due when its review date is today or earlier.
export const isDue = (card: SrsCard, today: string): boolean => card.due <= today

// Builds today's review queue from `universe`: overdue scheduled cards first
// (earliest due, then lowest box = weakest), then never-seen kana, capped.
export const dueKana = (
  map: SrsMap,
  universe: string[],
  today: string,
  cap = 40,
): string[] => {
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
