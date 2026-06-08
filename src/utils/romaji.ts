const BASIC_ROMAJI: Record<string, string> = {
  あ: 'a',
  い: 'i',
  う: 'u',
  え: 'e',
  お: 'o',
  か: 'ka',
  き: 'ki',
  く: 'ku',
  け: 'ke',
  こ: 'ko',
  さ: 'sa',
  し: 'shi',
  す: 'su',
  せ: 'se',
  そ: 'so',
  た: 'ta',
  ち: 'chi',
  つ: 'tsu',
  て: 'te',
  と: 'to',
  な: 'na',
  に: 'ni',
  ぬ: 'nu',
  ね: 'ne',
  の: 'no',
  は: 'ha',
  ひ: 'hi',
  ふ: 'fu',
  へ: 'he',
  ほ: 'ho',
  ま: 'ma',
  み: 'mi',
  む: 'mu',
  め: 'me',
  も: 'mo',
  や: 'ya',
  ゆ: 'yu',
  よ: 'yo',
  ら: 'ra',
  り: 'ri',
  る: 'ru',
  れ: 're',
  ろ: 'ro',
  わ: 'wa',
  を: 'wo',
  ん: 'n',
  が: 'ga',
  ぎ: 'gi',
  ぐ: 'gu',
  げ: 'ge',
  ご: 'go',
  ざ: 'za',
  じ: 'ji',
  ず: 'zu',
  ぜ: 'ze',
  ぞ: 'zo',
  だ: 'da',
  ぢ: 'ji',
  づ: 'zu',
  で: 'de',
  ど: 'do',
  ば: 'ba',
  び: 'bi',
  ぶ: 'bu',
  べ: 'be',
  ぼ: 'bo',
  ぱ: 'pa',
  ぴ: 'pi',
  ぷ: 'pu',
  ぺ: 'pe',
  ぽ: 'po',
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
  ゃ: 'ya',
  ゅ: 'yu',
  ょ: 'yo',
  ゎ: 'wa',
  っ: 'tsu',
  ゔ: 'vu',
  ー: '-',
}

const DIGRAPH_ROMAJI: Record<string, string> = {
  きゃ: 'kya',
  きゅ: 'kyu',
  きょ: 'kyo',
  しゃ: 'sha',
  しゅ: 'shu',
  しょ: 'sho',
  ちゃ: 'cha',
  ちゅ: 'chu',
  ちょ: 'cho',
  にゃ: 'nya',
  にゅ: 'nyu',
  にょ: 'nyo',
  ひゃ: 'hya',
  ひゅ: 'hyu',
  ひょ: 'hyo',
  みゃ: 'mya',
  みゅ: 'myu',
  みょ: 'myo',
  りゃ: 'rya',
  りゅ: 'ryu',
  りょ: 'ryo',
  ぎゃ: 'gya',
  ぎゅ: 'gyu',
  ぎょ: 'gyo',
  じゃ: 'ja',
  じゅ: 'ju',
  じょ: 'jo',
  びゃ: 'bya',
  びゅ: 'byu',
  びょ: 'byo',
  ぴゃ: 'pya',
  ぴゅ: 'pyu',
  ぴょ: 'pyo',
}

const katakanaToHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
    })
    .join('')

export const kanaToRomaji = (kana: string): string => {
  const normalized = katakanaToHiragana(kana)
  return DIGRAPH_ROMAJI[normalized] ?? BASIC_ROMAJI[normalized] ?? ''
}

export const textToRomaji = (text: string): string => {
  const chars = [...katakanaToHiragana(text)]
  const parts: string[] = []

  for (let i = 0; i < chars.length; i += 1) {
    const current = chars[i]!
    const next = chars[i + 1]
    const pair = next ? `${current}${next}` : ''

    if (pair && DIGRAPH_ROMAJI[pair]) {
      parts.push(DIGRAPH_ROMAJI[pair])
      i += 1
      continue
    }

    parts.push(BASIC_ROMAJI[current] ?? current)
  }

  return parts.join(' ')
}

export const textToRomajiCompact = (text: string): string => textToRomaji(text).replace(/ /g, '')

export const kanaCharsEqual = (a: string, b: string): boolean => {
  if (a === b) return true
  const ra = kanaToRomaji(a)
  return ra !== '' && ra === kanaToRomaji(b)
}

const ROMAJI_TO_KANA: Record<string, string> = (() => {
  const map: Record<string, string> = {}
  for (const [kana, romaji] of Object.entries(BASIC_ROMAJI)) {
    if (!(romaji in map)) map[romaji] = kana
  }
  for (const [kana, romaji] of Object.entries(DIGRAPH_ROMAJI)) {
    if (!(romaji in map)) map[romaji] = kana
  }
  return map
})()

export const romajiToKana = (romaji: string): string =>
  ROMAJI_TO_KANA[romaji.trim().toLowerCase()] ?? ''
