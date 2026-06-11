import type { KanaAnalysis } from '../types'

export const HIRAGANA_ROWS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', '', 'ゆ', '', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', '', 'を', '', 'ん'],
]

export const KATAKANA_ROWS = [
  ['ア', 'イ', 'ウ', 'エ', 'オ'],
  ['カ', 'キ', 'ク', 'ケ', 'コ'],
  ['サ', 'シ', 'ス', 'セ', 'ソ'],
  ['タ', 'チ', 'ツ', 'テ', 'ト'],
  ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  ['マ', 'ミ', 'ム', 'メ', 'モ'],
  ['ヤ', '', 'ユ', '', 'ヨ'],
  ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  ['ワ', '', 'ヲ', '', 'ン'],
]

export const isHiragana = (char: string) => /[\u3041-\u3096]/u.test(char)

export const isKatakana = (char: string) => /[\u30A1-\u30FA\u30FC]/u.test(char)

export const isKana = (char: string) => isHiragana(char) || isKatakana(char)

const SMALL_KANA = new Set([...'ぁぃぅぇぉゃゅょゎっァィゥェォャュョヮッ'])

export const isSmallKana = (char: string) => SMALL_KANA.has(char)

export const extractKana = (text: string): string[] => [...text].filter(isKana)

export const analyzeKana = (text: string): KanaAnalysis => {
  const kana = extractKana(text)
  const frequency = new Map<string, number>()

  for (const char of kana) {
    frequency.set(char, (frequency.get(char) ?? 0) + 1)
  }

  return {
    hiraganaCount: [...text].filter(isHiragana).length,
    katakanaCount: [...text].filter(isKatakana).length,
    uniqueKana: [...frequency.keys()].sort((a, b) => a.localeCompare(b, 'ja')),
    mostFrequentKana: [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
      .slice(0, 8)
      .map(([kanaChar, count]) => ({ kana: kanaChar, count })),
  }
}
