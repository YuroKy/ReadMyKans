// Pure helpers for the GitHub-style activity heatmap. Works on UTC date strings
// (YYYY-MM-DD) to stay free of timezone drift and trivially testable.

export interface CalendarDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
  future: boolean
}

export type CalendarWeek = CalendarDay[] // 7 days, Monday → Sunday

const MS_DAY = 86_400_000
const parse = (date: string): number => Date.parse(`${date}T00:00:00Z`)

export const addDays = (date: string, n: number): string =>
  new Date(parse(date) + n * MS_DAY).toISOString().slice(0, 10)

// Monday = 0 … Sunday = 6 (Ukrainian week starts on Monday).
export const mondayIndex = (date: string): number => {
  const dow = new Date(parse(date)).getUTCDay() // 0 = Sunday … 6 = Saturday
  return (dow + 6) % 7
}

export const activityLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count <= 0) return 0
  if (count < 3) return 1
  if (count < 6) return 2
  if (count < 11) return 3
  return 4
}

// `weeks` columns ending with the week that contains `today`. Each column is a
// Monday→Sunday array. Days after `today` are flagged so the UI can dim them.
export const buildCalendar = (
  activity: Record<string, number>,
  today: string,
  weeks = 16,
): CalendarWeek[] => {
  const endOfWeek = addDays(today, 6 - mondayIndex(today)) // Sunday of current week
  let cursor = addDays(endOfWeek, -(weeks * 7 - 1)) // first Monday

  const result: CalendarWeek[] = []
  for (let w = 0; w < weeks; w += 1) {
    const week: CalendarWeek = []
    for (let d = 0; d < 7; d += 1) {
      const count = activity[cursor] ?? 0
      week.push({ date: cursor, count, level: activityLevel(count), future: cursor > today })
      cursor = addDays(cursor, 1)
    }
    result.push(week)
  }
  return result
}

const MONTHS_UK = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру']

export const monthShort = (date: string): string => MONTHS_UK[new Date(parse(date)).getUTCMonth()] ?? ''

// Number of days with any activity in the grid (for a summary line).
export const activeDays = (weeks: CalendarWeek[]): number =>
  weeks.reduce((sum, week) => sum + week.filter((d) => d.count > 0).length, 0)
