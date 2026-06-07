import type { ComparisonResult, ComparisonSegment } from '../types'
import { isKana } from '../utils/kana'
import { levenshteinDistance, similarityPercentage } from '../utils/levenshtein'
import { kanaCharsEqual, textToRomajiCompact } from '../utils/romaji'
import { toReadingHiragana } from '../utils/reading'
import { normalizeJapaneseText } from '../utils/textNormalize'

type Operation = 'correct' | 'missed' | 'extra' | 'mismatch'

const charsEqual = kanaCharsEqual

const buildSegments = (original: string, spoken: string): ComparisonSegment[] => {
  const a = [...original]
  const b = [...spoken]
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0))

  for (let i = 0; i < rows; i += 1) {
    matrix[i]![0] = i
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0]![j] = j
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = charsEqual(a[i - 1]!, b[j - 1]!) ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      )
    }
  }

  const reversed: ComparisonSegment[] = []
  let i = a.length
  let j = b.length

  while (i > 0 || j > 0) {
    const current = matrix[i]![j]!

    if (i > 0 && j > 0 && charsEqual(a[i - 1]!, b[j - 1]!) && current === matrix[i - 1]![j - 1]) {
      reversed.push({ type: 'correct', original: a[i - 1], spoken: b[j - 1] })
      i -= 1
      j -= 1
      continue
    }

    if (i > 0 && j > 0 && current === matrix[i - 1]![j - 1]! + 1) {
      reversed.push({ type: 'mismatch', original: a[i - 1], spoken: b[j - 1] })
      i -= 1
      j -= 1
      continue
    }

    if (i > 0 && current === matrix[i - 1]![j]! + 1) {
      reversed.push({ type: 'missed', original: a[i - 1] })
      i -= 1
      continue
    }

    if (j > 0) {
      reversed.push({ type: 'extra', spoken: b[j - 1] })
      j -= 1
    }
  }

  const compacted: ComparisonSegment[] = []

  for (const segment of reversed.reverse()) {
    const last = compacted[compacted.length - 1]
    if (last?.type === segment.type) {
      last.original = `${last.original ?? ''}${segment.original ?? ''}`
      last.spoken = `${last.spoken ?? ''}${segment.spoken ?? ''}`
    } else {
      compacted.push({ ...segment })
    }
  }

  return compacted
}

const collectReviewKana = (segments: ComparisonSegment[]): string[] => {
  const counts = new Map<string, number>()

  for (const segment of segments) {
    if (segment.type === 'correct' || segment.type === 'extra') {
      continue
    }

    for (const char of [...(segment.original ?? '')]) {
      if (isKana(char)) {
        counts.set(char, (counts.get(char) ?? 0) + 1)
      }
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'))
    .slice(0, 12)
    .map(([kana]) => kana)
}

const countMismatches = (segments: ComparisonSegment[]): number =>
  segments.filter((segment) => segment.type !== 'correct').length

export const compareTexts = (original: string, spoken: string): ComparisonResult => {
  // Конвертуємо кандзі+кану → читання в хірагані (якщо словник готовий),
  // інакше повертається сирий текст. Це і є ключове виправлення:
  // порівнюємо вимову, а не поверхневі символи.
  const normalizedOriginal = normalizeJapaneseText(toReadingHiragana(original))
  const normalizedSpoken = normalizeJapaneseText(toReadingHiragana(spoken))
  const segments = buildSegments(normalizedOriginal, normalizedSpoken)

  // Точність рахуємо на рівні ромадзі — стійко до катакана/хірагана та
  // фонетичних еквівалентів (じ/ぢ, ず/づ).
  const romajiOriginal = textToRomajiCompact(normalizedOriginal)
  const romajiSpoken = textToRomajiCompact(normalizedSpoken)
  const distance = levenshteinDistance(romajiOriginal, romajiSpoken)

  return {
    normalizedOriginal,
    normalizedSpoken,
    distance,
    similarity: similarityPercentage(romajiOriginal, romajiSpoken),
    mismatchCount: countMismatches(segments),
    segments,
    kanaToReview: collectReviewKana(segments),
  }
}

export const segmentLabel: Record<Operation, string> = {
  correct: 'Правильно',
  missed: 'Пропущено',
  extra: 'Зайве',
  mismatch: 'Відмінність',
}

export const useTextComparison = () => ({
  compareTexts,
})
