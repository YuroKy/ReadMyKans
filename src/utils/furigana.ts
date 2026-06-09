import { textToRomajiCompact } from './romaji'
import type { ReadingToken } from './reading'

export type FuriganaMode = 'furigana' | 'romaji'

export interface RubySegment {
  base: string
  ruby: string
}

const KANJI = /[㐀-䶿一-龯豈-﫿]/u

export const hasKanji = (text: string): boolean => KANJI.test(text)

// Turn reading tokens into ruby segments. Ruby is shown only over tokens that
// contain kanji and whose reading differs from the surface form.
export const toRubySegments = (
  tokens: ReadingToken[],
  mode: FuriganaMode = 'furigana',
): RubySegment[] =>
  tokens.map((token) => {
    const needsRuby = Boolean(token.reading) && hasKanji(token.surface) && token.reading !== token.surface
    if (!needsRuby) return { base: token.surface, ruby: '' }
    const ruby = mode === 'romaji' ? textToRomajiCompact(token.reading) : token.reading
    return { base: token.surface, ruby }
  })
