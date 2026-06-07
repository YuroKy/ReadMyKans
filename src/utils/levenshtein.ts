export const levenshteinDistance = (source: string, target: string): number => {
  const a = [...source]
  const b = [...target]
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)

  for (let i = 1; i <= a.length; i += 1) {
    const current = Array<number>(b.length + 1).fill(0)
    current[0] = i

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + cost,
      )
    }

    previous = current
  }

  return previous[b.length]!
}

export const similarityPercentage = (source: string, target: string): number => {
  const maxLength = Math.max([...source].length, [...target].length)

  if (maxLength === 0) {
    return 100
  }

  const distance = levenshteinDistance(source, target)
  return Math.max(0, Math.round((1 - distance / maxLength) * 100))
}
