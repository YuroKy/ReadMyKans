import { isKana } from './kana'
import type { WordEntry } from '../data/wordSources'

// Парсер власного словника: рядки «かな = переклад» або CSV «かな,переклад».
// Биті рядки не валять увесь список — повертаються окремо з номером рядка,
// щоб UI міг показати, що саме не розпізналось.

export interface CustomVocabError {
  line: number
  text: string
  reason: string
}

export interface ParsedCustomVocab {
  entries: WordEntry[]
  errors: CustomVocabError[]
}

const splitLine = (line: string): [string, string] | null => {
  // «=» пріоритетніший за кому: у перекладі кома трапляється часто.
  for (const separator of ['=', ',', '，']) {
    const at = line.indexOf(separator)
    if (at > 0) return [line.slice(0, at).trim(), line.slice(at + separator.length).trim()]
  }
  return null
}

export const parseCustomVocab = (raw: string): ParsedCustomVocab => {
  const entries: WordEntry[] = []
  const errors: CustomVocabError[] = []
  const seen = new Set<string>()

  raw.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim()
    if (!line) return
    const lineNo = lineIndex + 1

    const parts = splitLine(line)
    if (!parts) {
      errors.push({ line: lineNo, text: line, reason: 'немає роздільника «=» або коми' })
      return
    }

    const [kana, translation] = parts
    if (!kana || !translation) {
      errors.push({ line: lineNo, text: line, reason: 'порожня кана або переклад' })
      return
    }
    if (![...kana].every(isKana)) {
      errors.push({ line: lineNo, text: line, reason: 'ліва частина має бути лише каною' })
      return
    }
    if (seen.has(kana)) {
      errors.push({ line: lineNo, text: line, reason: 'дубль слова' })
      return
    }

    seen.add(kana)
    entries.push({ kana, translation })
  })

  return { entries, errors }
}
