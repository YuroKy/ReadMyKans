// Pure helpers for the time-attack (sprint) mode.

export const SPRINT_DURATION = 60 // seconds

// 'classic' — 60 s time attack; 'suddendeath' — no timer, one mistake ends the
// run, so score equals the length of the correct streak.
export type SprintMode = 'classic' | 'suddendeath'

// Personal bests for the two modes live under separate keys so a long
// sudden-death streak can't masquerade as a time-attack score.
export const bestKeyFor = (mode: SprintMode): string =>
  mode === 'suddendeath' ? 'sprint:suddendeath' : 'sprint:overall'

// Pick the next target from the pool, avoiding an immediate repeat when possible
// so the same kana never shows twice in a row.
export const pickTarget = (
  pool: string[],
  prev: string,
  random: () => number = Math.random,
): string => {
  if (pool.length === 0) return ''
  if (pool.length === 1) return pool[0]!
  const pick = pool[Math.floor(random() * pool.length)] ?? pool[0]!
  if (pick !== prev) return pick
  // Deterministic fallback to the neighbour so we never loop or repeat.
  const idx = pool.indexOf(prev)
  return pool[(idx + 1) % pool.length]!
}
