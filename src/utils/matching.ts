import { kanaCharsEqual } from './romaji'

export const advanceMatch = (original: string[], spoken: string[], from: number): number => {
  let pointer = Math.max(0, Math.min(from, original.length))

  for (const char of spoken) {
    if (pointer >= original.length) break
    if (kanaCharsEqual(original[pointer]!, char)) {
      pointer += 1
    }
  }

  return pointer
}

export interface MatchDetail {
  matched: number

  attempt: string
}

export const matchDetail = (original: string[], spoken: string[], from: number): MatchDetail => {
  let pointer = Math.max(0, Math.min(from, original.length))
  let lastMatchedIndex = -1

  for (let i = 0; i < spoken.length; i += 1) {
    if (pointer >= original.length) break
    if (kanaCharsEqual(original[pointer]!, spoken[i]!)) {
      pointer += 1
      lastMatchedIndex = i
    }
  }

  const attempt =
    pointer < original.length && lastMatchedIndex + 1 < spoken.length
      ? spoken[lastMatchedIndex + 1]!
      : ''

  return { matched: pointer, attempt }
}
