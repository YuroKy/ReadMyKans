import { computed, ref, type Ref } from 'vue'
import { isKana } from '../utils/kana'
import { toReadingHiragana, readingReady } from '../utils/reading'
import { chunkKana, checkKanaAnswer, checkRomajiAnswer } from '../utils/chunking'
import { kanaToRomaji } from '../utils/romaji'

export type DrillOutcome = 'correct' | 'wrong'

export const useKanaDrill = (sourceText: Ref<string>, chunkSize: Ref<number>) => {
  const allKana = computed(() => {
    void readingReady.value
    return [...toReadingHiragana(sourceText.value)].filter(isKana)
  })

  const chunks = computed(() => chunkKana(allKana.value, chunkSize.value))
  const total = computed(() => chunks.value.length)

  const index = ref(0)
  const outcomes = ref<Array<DrillOutcome | null>>([])

  const lastOutcome = ref<DrillOutcome | null>(null)
  const lastAnswer = ref('')

  const currentChunk = computed(() => chunks.value[index.value] ?? [])
  const expectedKana = computed(() => currentChunk.value.join(''))
  const expectedRomaji = computed(() => currentChunk.value.map(kanaToRomaji).join(''))
  const isFinished = computed(() => total.value > 0 && index.value >= total.value)
  const correctCount = computed(() => outcomes.value.filter((o) => o === 'correct').length)

  const record = (outcome: DrillOutcome, answer: string) => {
    outcomes.value[index.value] = outcome
    lastOutcome.value = outcome
    lastAnswer.value = answer
  }

  const submitRomaji = (romaji: string): DrillOutcome => {
    const ok = checkRomajiAnswer(expectedKana.value, romaji)
    const outcome: DrillOutcome = ok ? 'correct' : 'wrong'
    record(outcome, romaji.trim())
    return outcome
  }

  const submitKana = (spokenText: string): DrillOutcome => {
    const raw = [...spokenText].filter(isKana)
    const reading = [...toReadingHiragana(spokenText)].filter(isKana)
    const ok =
      checkKanaAnswer(currentChunk.value, raw) || checkKanaAnswer(currentChunk.value, reading)
    const outcome: DrillOutcome = ok ? 'correct' : 'wrong'
    record(outcome, (raw.length ? raw : reading).join(''))
    return outcome
  }

  const next = () => {
    lastOutcome.value = null
    lastAnswer.value = ''
    if (index.value < total.value) index.value += 1
  }

  const retry = () => {
    lastOutcome.value = null
    lastAnswer.value = ''
  }

  const reset = () => {
    index.value = 0
    outcomes.value = []
    lastOutcome.value = null
    lastAnswer.value = ''
  }

  return {
    chunks,
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
    next,
    retry,
    reset,
  }
}
