import { ref } from 'vue'
import type { ExamRecord } from '../utils/exam'

// Історія тижневих екзаменів, ключ `kana-exam` (singleton, як інші стори).

const KEY = 'kana-exam'

const read = (): ExamRecord[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as ExamRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const records = ref<ExamRecord[]>(read())

export const useExamHistory = () => {
  const add = (record: ExamRecord) => {
    records.value = [...records.value, record]
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(records.value))
  }

  return { records, add }
}
