import { computed, ref, watch, type Ref } from 'vue'
import { useKanaDrill } from './useKanaDrill'
import { useDrillSource } from './useDrillSource'
import { useKanaStats } from './useKanaStats'
import { useSrsSchedule } from './useSrsSchedule'
import { useDailyProgress } from './useDailyProgress'
import { useBestScores } from './useBestScores'
import { useFormatsSeen } from './useFormatsSeen'
import { useToasts } from './useToasts'
import { isKana, HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import { romajiToKana } from '../utils/romaji'
import { analyzeKanaDifficulty } from '../utils/kanaDifficulty'
import { translationFor } from '../data/vocabulary'
import { collectConfusionPairs } from '../utils/confusions'
import { encouragement } from '../utils/encouragement'
import { track } from '../utils/analytics'

export type DrillFormat = 'recognition' | 'dictation' | 'choice' | 'writing'
export type DrillOutcome = 'correct' | 'wrong'

const WHOLE_WORD = 6
// Formats whose card is a single glyph (a tile / a stroke target) and so cannot
// span a multi-kana chunk.
const SINGLE_KANA_FORMATS: DrillFormat[] = ['choice', 'writing']

const SRS_UNIVERSE = [...HIRAGANA_ROWS.flat(), ...KATAKANA_ROWS.flat()].filter(Boolean)

const FORMAT_KEY = 'kana-drill-format'
const isFormat = (v: unknown): v is DrillFormat =>
  v === 'recognition' || v === 'dictation' || v === 'choice' || v === 'writing'
const loadFormat = (): DrillFormat => {
  if (typeof window === 'undefined') return 'recognition'
  const stored = localStorage.getItem(FORMAT_KEY)
  return isFormat(stored) ? stored : 'recognition'
}

// Shared «deck» state for every drill format. Owns the two orthogonal axes —
// source (which kana) and format (how you're tested) — plus card navigation,
// stats/SRS recording and the end-of-session summary. Format components stay
// thin: they render the current card and call answer*/skip/restart.
export const useDrillDeck = (sourceText: Ref<string>) => {
  const format = ref<DrillFormat>(loadFormat())
  watch(format, (value) => {
    if (typeof window !== 'undefined') localStorage.setItem(FORMAT_KEY, value)
  })

  // Source axis is declared before chunking: the «vocab» mode forces
  // whole-word cards (a vocabulary card is the word, not a slice of it).
  const drillMode = ref('text')

  const chunkSize = ref(1)
  const isSingleKanaFormat = computed(() => SINGLE_KANA_FORMATS.includes(format.value))
  const isWordMode = computed(() => drillMode.value === 'vocab')
  const effectiveChunkSize = computed(() => {
    if (isSingleKanaFormat.value) return 1
    if (isWordMode.value) return Number.MAX_SAFE_INTEGER
    return chunkSize.value >= WHOLE_WORD ? Number.MAX_SAFE_INTEGER : chunkSize.value
  })

  // --- Source axis -----------------------------------------------------------
  const { sets: kanaSets, effectiveKana } = useDrillSource(drillMode)

  const { record: srsRecord, due: srsDue } = useSrsSchedule()
  const srsSnapshot = ref('')
  const srsDueCount = computed(() => srsDue(SRS_UNIVERSE).length)
  const refreshSrsSnapshot = () => {
    srsSnapshot.value = srsDue(SRS_UNIVERSE).join('')
  }
  const srsEmpty = computed(() => drillMode.value === 'srs' && srsSnapshot.value.length === 0)

  const sourceRef = computed(() => {
    if (drillMode.value === 'srs') return srsSnapshot.value
    const generated = effectiveKana.value
    return generated && generated.length > 0 ? generated : sourceText.value
  })
  const modeFellBack = computed(
    () =>
      drillMode.value !== 'text' &&
      drillMode.value !== 'srs' &&
      !(effectiveKana.value && effectiveKana.value.length > 0),
  )

  // --- Card navigation -------------------------------------------------------
  const {
    total,
    index,
    currentChunk,
    expectedKana,
    expectedRomaji,
    isFinished,
    correctCount,
    lastOutcome,
    lastAnswer,
    submitRomaji,
    submitKana,
    submitOutcome,
    next,
    retry,
    reset,
  } = useKanaDrill(sourceRef, effectiveChunkSize)

  const isSingleKana = computed(() => currentChunk.value.length === 1)

  // Переклад картки у словниковому режимі ('' поза ним або без збігу).
  const currentTranslation = computed(() =>
    isWordMode.value ? translationFor(expectedKana.value) : '',
  )

  // --- Stats & SRS recording -------------------------------------------------
  const stats = useKanaStats()
  const lastConfused = ref('')
  const sessionPairs = ref<Array<[string, string]>>([])

  const recordStat = (outcome: DrillOutcome, confusedKana: string) => {
    if (!isSingleKana.value) return
    const kana = expectedKana.value
    srsRecord(kana, outcome === 'correct')
    if (outcome === 'correct') {
      stats.record(kana, true)
      lastConfused.value = ''
    } else {
      const confused = confusedKana && confusedKana !== kana ? confusedKana : ''
      stats.record(kana, false, confused || undefined)
      lastConfused.value = confused
      if (confused) sessionPairs.value.push([kana, confused])
    }
  }

  const dailyProgress = useDailyProgress()
  const toasts = useToasts()
  const { record: recordBest } = useBestScores()

  // Streak of correct answers within the session. Burning a built-up combo is
  // the dramatic moment, so the loss gets a toast and a UI burst signal.
  const combo = ref(0)
  const sessionBestCombo = ref(0)
  const comboBurst = ref(0) // bumped when a combo ≥5 burns; KanaDrill animates on it
  const trackCombo = (outcome: DrillOutcome) => {
    if (outcome === 'correct') {
      combo.value += 1
      if (combo.value > sessionBestCombo.value) sessionBestCombo.value = combo.value
      return
    }
    if (combo.value >= 5) {
      toasts.push({ icon: '💔', title: `Комбо ×${combo.value} згоріло`, text: 'Серія обнулилась. Починай спочатку.' })
      comboBurst.value += 1
    }
    recordBest('drill:combo', sessionBestCombo.value)
    combo.value = 0
  }

  // Auto-advance after a correct answer (same 800ms beat across formats). Every
  // answered card counts toward the daily goal; crossing it celebrates once.
  const handleOutcome = (outcome: DrillOutcome) => {
    trackCombo(outcome)
    if (dailyProgress.add(1)) {
      toasts.push({ icon: '🎯', title: 'Денну ціль виконано!', text: 'Так тримати — стрік у безпеці.' })
    }
    if (outcome !== 'correct') return
    window.setTimeout(() => {
      if (!isFinished.value) next()
      else lastOutcome.value = null
    }, 800)
  }

  // --- Answer entry points (one per input modality) --------------------------
  const answerRomaji = (romaji: string): DrillOutcome => {
    const outcome = submitRomaji(romaji)
    recordStat(outcome, romajiToKana(romaji))
    handleOutcome(outcome)
    return outcome
  }

  const answerVoice = (spokenText: string): DrillOutcome => {
    const outcome = submitKana(spokenText)
    const firstKana = [...spokenText].filter(isKana)[0] ?? ''
    recordStat(outcome, firstKana)
    handleOutcome(outcome)
    return outcome
  }

  // A single tapped kana (choice format).
  const answerKana = (chosenKana: string): DrillOutcome => {
    const outcome = submitKana(chosenKana)
    recordStat(outcome, chosenKana)
    handleOutcome(outcome)
    return outcome
  }

  // Self/auto-assessed outcome (writing format: correctness comes from how well
  // the trace covers the glyph, not from text matching). No confusion partner.
  const answerWritten = (correct: boolean): DrillOutcome => {
    const outcome: DrillOutcome = correct ? 'correct' : 'wrong'
    submitOutcome(outcome, expectedKana.value)
    recordStat(outcome, '')
    handleOutcome(outcome)
    return outcome
  }

  // --- Session lifecycle -----------------------------------------------------
  // Bumped on every session reset so format components can clear their local
  // input/focus with a single watcher (covers chunk/source/format changes too).
  const sessionToken = ref(0)
  const resetSession = () => {
    if (drillMode.value === 'srs') refreshSrsSnapshot()
    reset()
    sessionPairs.value = []
    lastConfused.value = ''
    combo.value = 0
    sessionBestCombo.value = 0
    sessionToken.value += 1
  }
  const restart = () => resetSession()
  // Пропуск кількох карток за раз (кнопки ×3/×5/×10).
  const skip = (count = 1) => {
    for (let i = 0; i < count && !isFinished.value; i += 1) next()
  }

  watch([chunkSize, drillMode, format], resetSession)
  watch(index, () => {
    lastConfused.value = ''
  })

  // Remember which formats have been tried (feeds the «all formats» achievement).
  const { mark: markFormatSeen } = useFormatsSeen()
  watch(format, (value) => markFormatSeen(value), { immediate: true })
  watch(format, (value) => track('drill-format-change', { format: value }))

  // --- Summary ---------------------------------------------------------------
  const wrongCount = computed(() => Math.max(0, total.value - correctCount.value))
  const accuracy = computed(() =>
    total.value === 0 ? 0 : Math.round((correctCount.value / total.value) * 100),
  )
  const headline = computed(() => encouragement(accuracy.value))

  // Деку кінець — фіксуємо, як саме тренувались і з яким результатом.
  watch(isFinished, (finished) => {
    if (finished) recordBest('drill:combo', sessionBestCombo.value)
    if (finished && total.value > 0) {
      track('drill-finish', {
        format: format.value,
        source: drillMode.value,
        cards: total.value,
        accuracy: accuracy.value,
      })
    }
  })

  const difficulty = computed(() => analyzeKanaDifficulty(sourceText.value))
  const difficultyTiers = computed(() => {
    const data = difficulty.value
    const denom = data.total || 1
    const pct = (value: number) => Math.round((value / denom) * 100)
    return [
      { key: 'easy', label: 'Легкі', count: data.easy, pct: pct(data.easy) },
      { key: 'medium', label: 'Середні', count: data.medium, pct: pct(data.medium) },
      { key: 'hard', label: 'Складні', count: data.hard, pct: pct(data.hard) },
    ]
  })
  const donutGradient = computed(() => {
    const data = difficulty.value
    if (data.total === 0) return 'conic-gradient(var(--divider) 0 100%)'
    const easyEnd = (data.easy / data.total) * 100
    const mediumEnd = easyEnd + (data.medium / data.total) * 100
    return `conic-gradient(var(--mint-strong) 0 ${easyEnd}%, var(--sky-strong) ${easyEnd}% ${mediumEnd}%, var(--rose-strong) ${mediumEnd}% 100%)`
  })
  const drillConfusions = computed(() => collectConfusionPairs(sessionPairs.value, 5))
  const weakSummary = computed(() => stats.weak().slice(0, 10))

  const chunkLabel = computed(() => {
    const n = chunkSize.value
    if (n >= WHOLE_WORD) return 'Слово'
    if (n === 1) return '1 кана'
    if (n >= 2 && n <= 4) return `${n} кани`
    return `${n} кан`
  })

  return {
    // axes
    format,
    chunkSize,
    isSingleKanaFormat,
    isWordMode,
    chunkLabel,
    drillMode,
    kanaSets,
    modeFellBack,
    // srs
    srsDueCount,
    srsEmpty,
    // navigation
    total,
    index,
    currentChunk,
    expectedKana,
    expectedRomaji,
    isFinished,
    correctCount,
    lastOutcome,
    lastAnswer,
    isSingleKana,
    currentTranslation,
    // answering
    answerRomaji,
    answerVoice,
    answerKana,
    answerWritten,
    retry,
    skip,
    restart,
    sessionToken,
    // stats / cues
    stats,
    lastConfused,
    combo,
    sessionBestCombo,
    comboBurst,
    // summary
    wrongCount,
    accuracy,
    headline,
    difficulty,
    difficultyTiers,
    donutGradient,
    drillConfusions,
    weakSummary,
  }
}

export type DrillDeck = ReturnType<typeof useDrillDeck>
