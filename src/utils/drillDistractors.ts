import { HIRAGANA_ROWS, KATAKANA_ROWS, isKana, isKatakana } from './kana'
import { kanaToRomaji } from './romaji'

// Generates plausible wrong options for a «choose the kana» drill. Good
// distractors are close enough to be tempting: kana the learner has actually
// confused, then phonetic neighbours (same consonant row / same vowel column),
// then anything else from the same script. We never mix scripts (a katakana
// target gets katakana distractors) and never return two tiles that read the
// same sound.

export interface DistractorOptions {
  // Candidate pool to draw the random tier from. Defaults to every kana of the
  // target's script. Confusions are honoured even if outside this pool.
  universe?: string[]
  // Known confusion partners for the target (highest priority).
  confusions?: string[]
  // Number of distractors to produce (default 3 → a 4-tile choice).
  count?: number
}

const gridFor = (target: string): string[][] => (isKatakana(target) ? KATAKANA_ROWS : HIRAGANA_ROWS)

const locate = (grid: string[][], target: string): { row: number; col: number } => {
  for (let r = 0; r < grid.length; r += 1) {
    const c = grid[r]!.indexOf(target)
    if (c !== -1) return { row: r, col: c }
  }
  return { row: -1, col: -1 }
}

export const buildDistractors = (target: string, options: DistractorOptions = {}): string[] => {
  const count = options.count ?? 3
  const grid = gridFor(target)
  const { row, col } = locate(grid, target)

  const sameRow = row === -1 ? [] : grid[row]!.filter(Boolean)
  const sameVowel = col === -1 ? [] : grid.map((r) => r[col] ?? '').filter(Boolean)
  const fallback = (options.universe ?? grid.flat()).filter((k) => isKatakana(k) === isKatakana(target))

  // Priority order: confusions → same row → same vowel → rest of the pool.
  const tiers = [options.confusions ?? [], sameRow, sameVowel, fallback]

  const result: string[] = []
  const seenSound = new Set<string>([kanaToRomaji(target)])

  for (const tier of tiers) {
    for (const kana of tier) {
      if (result.length >= count) return result
      if (!kana || kana === target || !isKana(kana)) continue
      const sound = kanaToRomaji(kana)
      // Skip anything that reads the same as the target or an option we already
      // picked (sound is '' for kana we can't romanise — keep those, they're rare).
      if (sound && seenSound.has(sound)) continue
      seenSound.add(sound || kana)
      result.push(kana)
    }
  }

  return result
}

// Fisher–Yates shuffle with an injectable RNG so tests stay deterministic.
export const shuffle = <T>(items: T[], random: () => number = Math.random): T[] => {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

// Convenience: the shuffled set of tiles (target + distractors) for a choice card.
export const buildChoices = (
  target: string,
  options: DistractorOptions = {},
  random: () => number = Math.random,
): string[] => shuffle([target, ...buildDistractors(target, options)], random)
