// Складання кани для екранної клавіатури: дакутен/хандакутен через
// Unicode-композицію (か + ゛ → が), малі кани — через явну мапу. Обидві
// операції graceful: несумісна кана повертається без змін / порожньо.

export const applyDakuten = (ch: string, mark: '゛' | '゜'): string => {
  if (!ch) return ch
  const combining = mark === '゛' ? '゙' : '゚'
  const composed = (ch + combining).normalize('NFC')
  return [...composed].length === 1 ? composed : ch
}

const SMALL_MAP: Record<string, string> = {
  あ: 'ぁ', い: 'ぃ', う: 'ぅ', え: 'ぇ', お: 'ぉ',
  つ: 'っ', や: 'ゃ', ゆ: 'ゅ', よ: 'ょ', わ: 'ゎ',
  ア: 'ァ', イ: 'ィ', ウ: 'ゥ', エ: 'ェ', オ: 'ォ',
  ツ: 'ッ', ヤ: 'ャ', ユ: 'ュ', ヨ: 'ョ', ワ: 'ヮ',
}

// '' — коли малої форми не існує.
export const toSmallKana = (ch: string): string => SMALL_MAP[ch] ?? ''
