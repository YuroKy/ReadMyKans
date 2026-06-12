import { reviewPriority, todayString, type SrsMap, type SrsStat } from '../utils/srs'
import { canonicalSpokenKana } from '../utils/spokenKana'
import { VOCABULARY } from './vocabulary'
import { NUMBER_WORDS } from './numbers'
import { KANJI_N5 } from './kanjiN5'
import { LIBRARY_WORDS } from './libraryWords'

// Спільний шар «словесних» джерел дрила (словник N5, числа, власні слова,
// кандзі): один тип запису, один лукап перекладу/гліфа і одне сортування за
// терміновістю — щоб дека і джерела не знали, звідки саме прийшло слово.

export interface WordEntry {
  kana: string
  translation: string
  // Гліф для показу замість кани (кандзі-слова); кана лишається відповіддю.
  display?: string
}

// Дрил веде картки через читання kuromoji, яке зводить катакану до хіраґани
// й нормалізує вимову (は→わ, ありがとう→ありがとー) — тож і ключі індексу,
// і запити канонізуються canonicalSpokenKana, щоб лукап не залежав від того,
// яку саме форму віддав kuromoji.
// Слова користувача реєструються динамічно (з localStorage), решта — статичні
// дані. Пізніший у списку виграє колізію ключа: словоформи бібліотеки —
// найслабші (лише для перекладу у фідбеку, не живлять жодне джерело деки),
// власний переклад перекриває все.
let customWords: WordEntry[] = []
let cache: Map<string, WordEntry> | null = null

const buildIndex = (): Map<string, WordEntry> => {
  const map = new Map<string, WordEntry>()
  for (const entry of [...LIBRARY_WORDS, ...VOCABULARY, ...NUMBER_WORDS, ...customWords]) {
    map.set(canonicalSpokenKana(entry.kana), entry)
  }
  return map
}

export const setCustomWords = (entries: WordEntry[]): void => {
  customWords = entries
  cache = null
}

const entryFor = (kana: string): WordEntry | undefined => {
  if (!cache) cache = buildIndex()
  return cache.get(canonicalSpokenKana(kana))
}

// Переклад для кани слова; '' коли слова немає у словниках (наприклад, коли
// формат single-kana ріже слова на окремі кани).
export const translationFor = (kana: string): string => entryFor(kana)?.translation ?? ''

// Кандзі-слова індексуються окремо: їхні читання часто збігаються зі словами
// словника (やま і 山), а гліф із власним перекладом потрібен лише
// кандзі-джерелу — спільний індекс зробив би показ гліфа залежним від
// порядку реєстрації словників.
let kanjiCache: Map<string, WordEntry> | null = null

export const kanjiWordFor = (kana: string): WordEntry | undefined => {
  if (!kanjiCache) {
    kanjiCache = new Map()
    for (const entry of KANJI_N5) {
      kanjiCache.set(canonicalSpokenKana(entry.kana), entry)
    }
  }
  return kanjiCache.get(canonicalSpokenKana(kana))
}

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
