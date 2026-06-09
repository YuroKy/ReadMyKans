import { HIRAGANA_ROWS, KATAKANA_ROWS } from './kana'

export interface KanaSet {
  id: string
  label: string
  kana: string
}

const DAKUTEN = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ'
const COMBOS =
  'きゃきゅきょしゃしゅしょちゃちゅちょにゃにゅにょひゃひゅひょみゃみゅみょりゃりゅりょぎゃぎゅぎょじゃじゅじょびゃびゅびょぴゃぴゅぴょ'

export const buildKanaSets = (): KanaSet[] => {
  const sets: KanaSet[] = [
    { id: 'hiragana', label: 'Уся хіраґана', kana: HIRAGANA_ROWS.flat().filter(Boolean).join('') },
    { id: 'katakana', label: 'Уся катакана', kana: KATAKANA_ROWS.flat().filter(Boolean).join('') },
    { id: 'dakuten', label: 'Дакутен і хандакутен', kana: DAKUTEN },
    { id: 'combos', label: 'Комбінації (yōon)', kana: COMBOS },
  ]

  HIRAGANA_ROWS.forEach((row, i) => {
    const kana = row.filter(Boolean).join('')
    const first = row.find(Boolean) ?? ''
    sets.push({ id: `row-${i}`, label: `Ряд ${first}`, kana })
  })

  return sets
}

export const findKanaSet = (id: string): KanaSet | undefined =>
  buildKanaSets().find((set) => set.id === id)
