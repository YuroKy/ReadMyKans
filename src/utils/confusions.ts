import type { ComparisonSegment } from '../types'
import { isKana } from './kana'
import { kanaCharsEqual } from './romaji'

export interface ConfusionPair {
  a: string
  b: string
  count: number
}

export const collectConfusionPairs = (
  pairs: Array<[string, string]>,
  limit = 5,
): ConfusionPair[] => {
  const counts = new Map<string, ConfusionPair>()

  for (const [expected, heard] of pairs) {
    if (!isKana(expected) || !isKana(heard)) continue
    if (kanaCharsEqual(expected, heard)) continue

    const [a, b] = [expected, heard].sort((x, y) => x.localeCompare(y, 'ja')) as [string, string]
    const key = `${a}|${b}`
    const existing = counts.get(key)

    if (existing) {
      existing.count += 1
    } else {
      counts.set(key, { a, b, count: 1 })
    }
  }

  return [...counts.values()]
    .sort((x, y) => y.count - x.count || x.a.localeCompare(y.a, 'ja'))
    .slice(0, limit)
}

export const collectConfusions = (
  segments: ComparisonSegment[],
  limit = 5,
): ConfusionPair[] => {
  const pairs: Array<[string, string]> = []

  for (const segment of segments) {
    if (segment.type !== 'mismatch') continue

    const original = [...(segment.original ?? '')]
    const spoken = [...(segment.spoken ?? '')]
    const length = Math.min(original.length, spoken.length)

    for (let i = 0; i < length; i += 1) {
      pairs.push([original[i]!, spoken[i]!])
    }
  }

  return collectConfusionPairs(pairs, limit)
}
