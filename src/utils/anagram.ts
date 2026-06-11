// Перемішування плиток для формату «анаграма». Гарантія: якщо серед плиток є
// хоча б дві різні, порядок ніколи не збігається з вихідним — інакше картка
// розвʼязувалась би «натисни все підряд».

export const shuffleTiles = (kana: string[], rng: () => number = Math.random): string[] => {
  const tiles = [...kana]
  if (tiles.length < 2) return tiles

  // Fisher–Yates
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const a = tiles[i] ?? ''
    tiles[i] = tiles[j] ?? ''
    tiles[j] = a
  }

  const identical = tiles.every((tile, i) => tile === kana[i])
  if (identical && new Set(kana).size > 1) {
    // Циклічний зсув дає інший порядок для будь-якої неконстантної послідовності.
    const first = tiles.shift()
    if (first !== undefined) tiles.push(first)
  }
  return tiles
}
