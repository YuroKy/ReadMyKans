import { kanaCharsEqual, textToRomajiCompact } from './romaji'

/**
 * Розбиває масив кани на «шматки» по `size` символів.
 * Розмір шматка = складність дрила: 1 (одна кана) → слово → рядок.
 */
export const chunkKana = (kana: string[], size: number): string[][] => {
  const n = Math.max(1, Math.floor(size))
  const chunks: string[][] = []
  for (let i = 0; i < kana.length; i += n) {
    chunks.push(kana.slice(i, i + n))
  }
  return chunks
}

// Кунрей → Хепберн: щоб приймати обидва написання (si=shi, tu=tsu тощо)
const KUNREI_TO_HEPBURN: Array<[string, string]> = [
  ['sya', 'sha'], ['syu', 'shu'], ['syo', 'sho'],
  ['tya', 'cha'], ['tyu', 'chu'], ['tyo', 'cho'],
  ['zya', 'ja'], ['zyu', 'ju'], ['zyo', 'jo'],
  ['si', 'shi'], ['ti', 'chi'], ['tu', 'tsu'], ['hu', 'fu'],
  ['zi', 'ji'], ['di', 'ji'], ['du', 'zu'],
]

/** Нормалізує введене користувачем ромадзі: нижній регістр, без пробілів,
 *  кунрей-варіанти → хепберн (щоб «si» і «shi» вважались однаковими). */
export const normalizeRomaji = (input: string): string => {
  let r = input.toLowerCase().replace(/[\s'’\-_]/g, '')
  for (const [kunrei, hepburn] of KUNREI_TO_HEPBURN) {
    r = r.split(kunrei).join(hepburn)
  }
  return r
}

/** Чи правильна введена ромадзі-відповідь для очікуваної кани. */
export const checkRomajiAnswer = (expectedKana: string, answer: string): boolean =>
  normalizeRomaji(answer) === textToRomajiCompact(expectedKana)

/** Чи правильна розпізнана/вимовлена кана (романі-толерантно, як префікс —
 *  ASR може додати зайве в кінці). */
export const checkKanaAnswer = (expected: string[], spoken: string[]): boolean => {
  if (spoken.length < expected.length) return false
  for (let i = 0; i < expected.length; i += 1) {
    if (!kanaCharsEqual(expected[i]!, spoken[i]!)) return false
  }
  return true
}
