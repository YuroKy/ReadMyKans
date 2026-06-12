// Канонічна «вимовна» форма кани для лукапів словників.
//
// Дрил веде слова через kuromoji-читання (pronunciation), яке відрізняється
// від орфографії: частка は→わ, へ→え, довгі голосні стягуються в ー
// (ありがとう→アリガトー), ぢ/づ→じ/ず. Які саме заміни зробить kuromoji,
// залежить від токенізації — передбачити неможливо, тож канонізуємо ОБИДВА
// боки лукапа (ключ словника й запит) однією функцією: яку б форму не віддав
// kuromoji, канонічні рядки збігаються.
const toHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char
    })
    .join('')

const VOWEL = new Map<string, string>()
for (const [vowel, chars] of [
  ['a', 'あかがさざただなはばぱまやらわぁゃ'],
  ['i', 'いきぎしじちぢにひびぴみりぃ'],
  ['u', 'うくぐすずつづぬふぶぷむゆるぅゅ'],
  ['e', 'えけげせぜてでねへべぺめれぇ'],
  ['o', 'おこごそぞとどのほぼぽもよろをぉょ'],
] as const) {
  for (const char of chars) VOWEL.set(char, vowel)
}

// Голосний-подовжувач після відповідного ряду (おう/よう, ちい, せい, ばあ…)
// kuromoji вимовляє як ー.
const prolongs = (char: string, prevVowel: string): boolean =>
  (char === 'あ' && prevVowel === 'a') ||
  (char === 'い' && (prevVowel === 'i' || prevVowel === 'e')) ||
  (char === 'う' && (prevVowel === 'u' || prevVowel === 'o')) ||
  (char === 'え' && prevVowel === 'e') ||
  (char === 'お' && prevVowel === 'o')

export const canonicalSpokenKana = (text: string): string => {
  let out = ''
  let prevVowel = ''
  for (const raw of toHiragana(text)) {
    let char = raw
    if (char === 'ぢ') char = 'じ'
    else if (char === 'づ') char = 'ず'
    else if (char === 'は') char = 'わ'
    else if (char === 'へ') char = 'え'
    else if (char === 'を') char = 'お'

    if (char === 'ー' || prolongs(char, prevVowel)) {
      out += 'ー'
      // prevVowel лишається: ー продовжує той самий голосний (とおお → とーー)
    } else {
      out += char
      prevVowel = VOWEL.get(char) ?? ''
    }
  }
  return out
}
