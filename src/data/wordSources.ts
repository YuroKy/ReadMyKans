import { reviewPriority, todayString, type SrsMap, type SrsStat } from '../utils/srs'
import { VOCABULARY } from './vocabulary'
import { NUMBER_WORDS } from './numbers'

// Спільний шар «словесних» джерел дрила (словник N5, числа, власні слова,
// кандзі): один тип запису, один лукап перекладу/гліфа і одне сортування за
// терміновістю — щоб дека і джерела не знали, звідки саме прийшло слово.

export interface WordEntry {
  kana: string
  translation: string
  // Гліф для показу замість кани (кандзі-слова); кана лишається відповіддю.
  display?: string
}

// Катакана → хіраґана: дрил веде картки через читання kuromoji, яке зводить
// катакана-слова (テレビ) до хіраґани (てれび), тож індексуємо обидві форми.
const toHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char
    })
    .join('')

// Слова користувача реєструються динамічно (з localStorage), решта — статичні
// дані. Пізніший у списку виграє колізію ключа, тож власний переклад
// перекриває вбудований.
let customWords: WordEntry[] = []
let cache: Map<string, WordEntry> | null = null

const buildIndex = (): Map<string, WordEntry> => {
  const map = new Map<string, WordEntry>()
  for (const entry of [...VOCABULARY, ...NUMBER_WORDS, ...customWords]) {
    map.set(entry.kana, entry)
    map.set(toHiragana(entry.kana), entry)
  }
  return map
}

export const setCustomWords = (entries: WordEntry[]): void => {
  customWords = entries
  cache = null
}

const entryFor = (kana: string): WordEntry | undefined => {
  if (!cache) cache = buildIndex()
  return cache.get(kana)
}

// Переклад для кани слова; '' коли слова немає у словниках (наприклад, коли
// формат single-kana ріже слова на окремі кани).
export const translationFor = (kana: string): string => entryFor(kana)?.translation ?? ''

export const displayFor = (kana: string): string => entryFor(kana)?.display ?? ''

// Слова, чия найслабша кана найтерміновіша, — першими (та сама комбінована
// SRS-логіка, що й у цільових джерелах дрила).
export const orderByUrgency = (
  entries: WordEntry[],
  stats: Record<string, SrsStat>,
  schedule: SrsMap,
  today: string = todayString(),
): WordEntry[] => {
  const urgency = (word: string): number =>
    Math.max(...[...word].map((kana) => reviewPriority(stats[kana], schedule[kana], today)))
  return [...entries].sort((a, b) => urgency(b.kana) - urgency(a.kana))
}
