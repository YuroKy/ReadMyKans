import { computed, getCurrentInstance, onBeforeUnmount, ref, type Ref } from 'vue'
import { pickTarget, SPRINT_DURATION } from '../utils/sprint'
import { buildChoices } from '../utils/drillDistractors'
import { kanaCharsEqual, kanaToRomaji } from '../utils/romaji'
import { useKanaStats } from './useKanaStats'
import { useBestScores } from './useBestScores'
import { useDailyProgress } from './useDailyProgress'
import { useToasts } from './useToasts'

export type SprintStatus = 'idle' | 'running' | 'finished'

// 60-second time-attack: tap the kana that matches the prompt romaji, as many as
// you can. Score = number correct; combo is flair that resets on a miss. Records
// answers into the shared kana stats and tracks a personal best.
export const useSprint = (pool: Ref<string[]>, bestKey = 'sprint:overall') => {
  const stats = useKanaStats()
  const { record: recordBest, best } = useBestScores()
  const daily = useDailyProgress()
  const toasts = useToasts()

  const status = ref<SprintStatus>('idle')
  const timeLeft = ref(SPRINT_DURATION)
  const score = ref(0)
  const combo = ref(0)
  const bestCombo = ref(0)
  const target = ref('')
  const choices = ref<string[]>([])
  const lastCorrect = ref<boolean | null>(null)
  const isNewRecord = ref(false)

  const targetRomaji = computed(() => kanaToRomaji(target.value))
  const previousBest = computed(() => best(bestKey))

  let timer: ReturnType<typeof setInterval> | null = null

  const nextCard = () => {
    target.value = pickTarget(pool.value, target.value)
    choices.value = buildChoices(target.value, { count: 3 })
    lastCorrect.value = null
  }

  const stopTimer = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  const finish = () => {
    stopTimer()
    status.value = 'finished'
    isNewRecord.value = recordBest(bestKey, score.value)
  }

  const start = () => {
    if (pool.value.length === 0) return
    score.value = 0
    combo.value = 0
    bestCombo.value = 0
    timeLeft.value = SPRINT_DURATION
    isNewRecord.value = false
    status.value = 'running'
    nextCard()
    stopTimer()
    timer = setInterval(() => {
      timeLeft.value -= 1
      if (timeLeft.value <= 0) finish()
    }, 1000)
  }

  const answer = (chosen: string) => {
    if (status.value !== 'running') return
    const ok = kanaCharsEqual(chosen, target.value)
    stats.record(target.value, ok, ok ? undefined : chosen)
    if (daily.add(1)) {
      toasts.push({ icon: '🎯', title: 'Денну ціль виконано!', text: 'Так тримати — стрік у безпеці.' })
    }
    if (ok) {
      score.value += 1
      combo.value += 1
      if (combo.value > bestCombo.value) bestCombo.value = combo.value
    } else {
      combo.value = 0
    }
    lastCorrect.value = ok
    nextCard()
  }

  const reset = () => {
    stopTimer()
    status.value = 'idle'
    timeLeft.value = SPRINT_DURATION
    score.value = 0
    combo.value = 0
  }

  if (getCurrentInstance()) onBeforeUnmount(stopTimer)

  return {
    status,
    timeLeft,
    score,
    combo,
    bestCombo,
    target,
    targetRomaji,
    choices,
    lastCorrect,
    isNewRecord,
    previousBest,
    start,
    answer,
    reset,
    finish,
  }
}
