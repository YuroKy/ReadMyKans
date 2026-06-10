import { computed, ref } from 'vue'
import { useSrsSchedule } from './useSrsSchedule'
import { todayString } from '../utils/srs'
import { gamesLocked, overdueKana, ransomPool, type RansomState } from '../utils/debt'

// Лок міні-ігор за борг SRS + стан «відкупу» (ідеальна міні-сесія розблоковує
// ігри до кінця дня). Ключ `kana-ransom`.

const KEY = 'kana-ransom'

const read = (): RansomState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as RansomState) : null
  } catch {
    return null
  }
}

const ransom = ref<RansomState | null>(read())
// Жива міні-сесія відкупу: тримає панель змонтованою, навіть якщо борг уже
// впав нижче порога (відповіді гасять борг у реальному часі).
const ransomInProgress = ref(false)

export const useGameLock = () => {
  const { schedule } = useSrsSchedule()

  const debtCount = computed(() => overdueKana(schedule.value, todayString()).length)
  const locked = computed(() => gamesLocked(schedule.value, todayString(), ransom.value))
  const pool = computed(() => ransomPool(schedule.value, todayString()))

  const payRansom = () => {
    ransom.value = { date: todayString(), paid: true }
    ransomInProgress.value = false
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(ransom.value))
  }

  return { debtCount, locked, pool, payRansom, ransomInProgress }
}
