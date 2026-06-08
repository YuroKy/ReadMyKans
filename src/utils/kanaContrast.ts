import { kanaToRomaji } from './romaji'

export interface KanaContrast {
  a: string
  aRomaji: string
  b: string
  bRomaji: string

  note: string
}

const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

const split = (romaji: string): { onset: string; vowel: string } => {
  if (romaji === 'n') return { onset: 'n', vowel: '' }
  const vowel = romaji.slice(-1)
  if (VOWELS.has(vowel)) return { onset: romaji.slice(0, -1), vowel }
  return { onset: romaji, vowel: '' }
}

export const kanaContrast = (a: string, b: string): KanaContrast => {
  const aRomaji = kanaToRomaji(a)
  const bRomaji = kanaToRomaji(b)

  let note: string

  if (!aRomaji || !bRomaji) {
    note = `Порівняй вимову: ${a} і ${b}.`
  } else {
    const sa = split(aRomaji)
    const sb = split(bRomaji)

    if (sa.onset === sb.onset && sa.vowel !== sb.vowel) {
      note = `Однаковий приголосний «${sa.onset || '—'}», але різна голосна: ${a} = «${aRomaji}», ${b} = «${bRomaji}».`
    } else if (sa.vowel === sb.vowel && sa.vowel && sa.onset !== sb.onset) {
      note = `Однакова голосна «${sa.vowel}», але різний приголосний: ${a} = «${aRomaji}», ${b} = «${bRomaji}».`
    } else {
      note = `${a} = «${aRomaji}», ${b} = «${bRomaji}» — зовсім різні звуки.`
    }
  }

  return { a, aRomaji, b, bRomaji, note }
}
