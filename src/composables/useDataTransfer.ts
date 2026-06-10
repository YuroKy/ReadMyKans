const KEYS = [
  'kana-stats',
  'kana-reader-history',
  'kana-srs',
  'kana-streak',
  'kana-theme',
  'kana-daily',
  'kana-best',
  'kana-achievements',
  'kana-formats-seen',
  'kana-drill-format',
  'kana-drill-prefs',
  'kana-activity',
  'kana-reading-progress',
  'kana-reading-hide',
  'kana-ransom',
  'kana-exam',
]

export interface ExportBundle {
  app: 'ReadMyKans'
  version: 1
  exportedAt: string
  data: Record<string, unknown>
}

// Pure: build an export bundle from a reader fn (injectable for tests).
export const buildBundle = (read: (key: string) => string | null): ExportBundle => {
  const data: Record<string, unknown> = {}
  for (const key of KEYS) {
    const raw = read(key)
    if (raw == null) continue
    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }
  return { app: 'ReadMyKans', version: 1, exportedAt: new Date().toISOString(), data }
}

export const isValidBundle = (value: unknown): value is ExportBundle => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return candidate.app === 'ReadMyKans' && typeof candidate.data === 'object' && candidate.data !== null
}

export const useDataTransfer = () => {
  const exportData = () => {
    const bundle = buildBundle((key) => localStorage.getItem(key))
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `readmykans-progress-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (file: File): Promise<boolean> => {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      return false
    }
    if (!isValidBundle(parsed)) return false

    for (const [key, value] of Object.entries(parsed.data)) {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
    location.reload()
    return true
  }

  return { exportData, importData }
}
