import { ref } from 'vue'
import type { HistoryItem, SessionResult } from '../types'
import { makePreview } from '../utils/textNormalize'

const STORAGE_KEY = 'kana-reader-history'
const MAX_ITEMS = 10

const readHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export const useSessionHistory = () => {
  const history = ref<HistoryItem[]>(readHistory())

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value.slice(0, MAX_ITEMS)))
  }

  const addSession = (result: SessionResult) => {
    history.value = [
      {
        id: result.id,
        date: result.date,
        preview: makePreview(result.originalText),
        accuracy: result.accuracy,
        durationMs: result.durationMs,
        kanaToReview: result.kanaToReview,
      },
      ...history.value.filter((item) => item.id !== result.id),
    ].slice(0, MAX_ITEMS)

    persist()
  }

  const clearHistory = () => {
    history.value = []
    persist()
  }

  return {
    history,
    addSession,
    clearHistory,
  }
}
