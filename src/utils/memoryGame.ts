import { kanaToRomaji } from './romaji'
import { shuffle } from './drillDistractors'

// Pure logic for the kana matching (memory) mini-game. A deck is pairs of cards
// that share a `matchKey`: either hiragana↔katakana of the same sound, or
// kana↔romaji. Two cards match when their keys agree and they're not the same card.

export type MemoryMode = 'kana' | 'romaji'

export interface MemoryCard {
  id: string
  face: string
  matchKey: string
  romaji: boolean // true when the face is latin text (affects rendering)
}

// Hiragana → katakana (same row); leaves non-hiragana untouched.
export const hiraToKata = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : char
    })
    .join('')

// Drop kana that share a romaji reading so a match is never ambiguous.
const dedupeByRomaji = (pool: string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const kana of pool) {
    const key = kanaToRomaji(kana) || kana
    if (seen.has(key)) continue
    seen.add(key)
    out.push(kana)
  }
  return out
}

export const buildDeck = (
  pool: string[],
  count: number,
  mode: MemoryMode,
  random: () => number = Math.random,
): MemoryCard[] => {
  const unique = dedupeByRomaji(pool)
  const chosen = shuffle(unique, random).slice(0, Math.max(0, count))

  const cards: MemoryCard[] = []
  for (const kana of chosen) {
    const key = kanaToRomaji(kana) || kana
    cards.push({ id: `${key}-a`, face: kana, matchKey: key, romaji: false })
    if (mode === 'kana') {
      cards.push({ id: `${key}-b`, face: hiraToKata(kana), matchKey: key, romaji: false })
    } else {
      cards.push({ id: `${key}-b`, face: key, matchKey: key, romaji: true })
    }
  }

  return shuffle(cards, random)
}

export const isMatch = (a: MemoryCard, b: MemoryCard): boolean =>
  a.id !== b.id && a.matchKey === b.matchKey
