import { ref } from 'vue'

// Tracks which drill formats the learner has tried — feeds the «all formats»
// achievement. Tiny persisted set of format ids.

const KEY = 'kana-formats-seen'

const read = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const seen = ref<string[]>(read())

export const useFormatsSeen = () => {
  const mark = (format: string) => {
    if (seen.value.includes(format)) return
    seen.value = [...seen.value, format]
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(seen.value))
  }

  return { seen, mark }
}
