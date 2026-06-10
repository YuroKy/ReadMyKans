// «Борг SRS»: прострочені ЗАПЛАНОВАНІ картки (невидані кани боргом не
// вважаються — інакше новачок був би заблокований з першого дня). Коли борг
// сягає порога, міні-ігри замикаються до сплати «відкупу» — ідеальної
// міні-сесії з найпростроченіших кан.

import { isDue, type SrsMap } from './srs'

export const DEBT_THRESHOLD = 20
export const RANSOM_SIZE = 10

// Прострочені заплановані кани: найдавніші й найслабші першими.
export const overdueKana = (map: SrsMap, today: string): string[] => {
  const entries = Object.entries(map).filter(([, card]) => isDue(card, today))
  entries.sort(([, a], [, b]) => a.due.localeCompare(b.due) || a.box - b.box)
  return entries.map(([kana]) => kana)
}

export const ransomPool = (map: SrsMap, today: string): string[] =>
  overdueKana(map, today).slice(0, RANSOM_SIZE)

export interface RansomState {
  date: string // YYYY-MM-DD — день, на який сплачено
  paid: boolean
}

export const gamesLocked = (
  map: SrsMap,
  today: string,
  ransom: RansomState | null,
): boolean => {
  if (ransom && ransom.date === today && ransom.paid) return false
  return overdueKana(map, today).length >= DEBT_THRESHOLD
}
