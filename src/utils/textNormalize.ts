const punctuationMap: Record<string, string> = {
  '。': '.',
  '、': ',',
  '，': ',',
  '．': '.',
  '！': '!',
  '？': '?',
  '「': '"',
  '」': '"',
  '『': '"',
  '』': '"',
  '（': '(',
  '）': ')',
  '：': ':',
  '；': ';',
  '〜': '~',
  ー: 'ー',
}

const ignoredPunctuation = /[.,!?;:"'()[\]{}、。！？「」『』（）\s]/gu

export const normalizeJapaneseText = (text: string, ignorePunctuation = true): string => {
  const normalized = text
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .replace(/[。、，．！？「」『』（）：；〜ー]/gu, (char) => punctuationMap[char] ?? char)

  if (!ignorePunctuation) {
    return normalized
  }

  return normalized.replace(ignoredPunctuation, '')
}

export const makePreview = (text: string, maxLength = 48): string => {
  const compact = text.replace(/\s+/gu, ' ').trim()
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact
}
