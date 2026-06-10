const KEY = 'kana-reading-progress'

// Снапшот незавершеної сесії читання: дозволяє продовжити з того ж місця
// після перезавантаження сторінки чи зависання браузера.
export interface ReadingProgress {
  text: string
  confirmedLen: number
  elapsedMs: number
  savedAt: string
}

// Pure-валідація сирого JSON зі сховища (тестується без localStorage).
export const parseReadingProgress = (raw: string | null): ReadingProgress | null => {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const candidate = parsed as Record<string, unknown>
  if (typeof candidate.text !== 'string' || candidate.text.length === 0) return null
  if (typeof candidate.confirmedLen !== 'number' || !Number.isFinite(candidate.confirmedLen)) {
    return null
  }
  if (candidate.confirmedLen <= 0) return null
  const elapsedMs =
    typeof candidate.elapsedMs === 'number' && Number.isFinite(candidate.elapsedMs)
      ? Math.max(0, candidate.elapsedMs)
      : 0
  return {
    text: candidate.text,
    confirmedLen: Math.floor(candidate.confirmedLen),
    elapsedMs,
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : '',
  }
}

export const loadReadingProgress = (): ReadingProgress | null => {
  if (typeof localStorage === 'undefined') return null
  try {
    return parseReadingProgress(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export const saveReadingProgress = (progress: ReadingProgress) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {}
}

export const clearReadingProgress = () => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
