import { kanaCharsEqual, textToRomajiCompact } from './romaji'

export const chunkKana = (kana: string[], size: number): string[][] => {
  const n = Math.max(1, Math.floor(size))
  const chunks: string[][] = []
  for (let i = 0; i < kana.length; i += n) {
    chunks.push(kana.slice(i, i + n))
  }
  return chunks
}

// Chunk kana word by word so a chunk never crosses a word boundary. A word
// shorter than `size` yields a single chunk of its actual length (so size 5 on
// a 3-kana word shows 3); use a very large size for a «whole word» mode.
export const chunkKanaByWords = (words: string[][], size: number): string[][] => {
  const n = Math.max(1, Math.floor(size))
  const chunks: string[][] = []
  for (const word of words) {
    for (let i = 0; i < word.length; i += n) {
      chunks.push(word.slice(i, i + n))
    }
  }
  return chunks
}

// Наступний шматок із наскрізної позиції `offset` (кани рахуються через усі
// слова підряд), не перетинаючи межу слова — основа «зростаючого чанка», де
// розмір міняється після кожної відповіді й статичне нарізання не годиться.
export const takeChunk = (words: string[][], offset: number, size: number): string[] => {
  const n = Math.max(1, Math.floor(size))
  let acc = 0
  for (const word of words) {
    if (offset < acc + word.length) {
      const pos = offset - acc
      return word.slice(pos, pos + n)
    }
    acc += word.length
  }
  return []
}

const KUNREI_TO_HEPBURN: Array<[string, string]> = [
  ['sya', 'sha'],
  ['syu', 'shu'],
  ['syo', 'sho'],
  ['tya', 'cha'],
  ['tyu', 'chu'],
  ['tyo', 'cho'],
  ['zya', 'ja'],
  ['zyu', 'ju'],
  ['zyo', 'jo'],
  ['si', 'shi'],
  ['ti', 'chi'],
  ['tu', 'tsu'],
  ['hu', 'fu'],
  ['zi', 'ji'],
  ['di', 'ji'],
  ['du', 'zu'],
]

export const normalizeRomaji = (input: string): string => {
  let r = input
    .toLowerCase()
    // strip spaces, apostrophes, macrons and the long-vowel hyphen (ー → "-")
    .replace(/[\s'’\-_]/g, '')
    .replace(/ā/g, 'a')
    .replace(/ī/g, 'i')
    .replace(/ū/g, 'u')
    .replace(/ē/g, 'e')
    .replace(/[ōô]/g, 'o')
  for (const [kunrei, hepburn] of KUNREI_TO_HEPBURN) {
    r = r.split(kunrei).join(hepburn)
  }
  // Collapse long vowels so a chōonpu (ー) matches whether the learner wrote it
  // as a hyphen, omitted it, or doubled the vowel (ojiisan = oji-san = ojisan).
  return r.replace(/([aeiou])\1+/g, '$1')
}

export const checkRomajiAnswer = (expectedKana: string, answer: string): boolean =>
  normalizeRomaji(answer) === normalizeRomaji(textToRomajiCompact(expectedKana))

export const checkKanaAnswer = (expected: string[], spoken: string[]): boolean => {
  if (spoken.length < expected.length) return false
  for (let i = 0; i < expected.length; i += 1) {
    if (!kanaCharsEqual(expected[i]!, spoken[i]!)) return false
  }
  return true
}
