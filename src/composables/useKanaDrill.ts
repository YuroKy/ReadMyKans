import { computed, ref, type Ref } from 'vue'
import { isKana } from '../utils/kana'
import { toReadingHiragana, readingReady } from '../utils/reading'
import { chunkKanaByWords, takeChunk, checkKanaAnswer, checkRomajiAnswer } from '../utils/chunking'
import { kanaToRomaji } from '../utils/romaji'

export type DrillOutcome = 'correct' | 'wrong'

export const useKanaDrill = (
  sourceText: Ref<string>,
  chunkSize: Ref<number>,
  growing?: Ref<boolean>,
) => {
  // Split the source into words (by whitespace, incl. the full-width spaces the
  // texts use) and read each one, so chunks never cross a word boundary.
  const words = computed(() => {
    void readingReady.value
    return sourceText.value
      .split(/\s+/u)
      .map((word) => [...toReadingHiragana(word)].filter(isKana))
      .filter((word) => word.length > 0)
  })

  // «Зростаючий чанк»: розмір шматка живе у growSize (росте після правильної
  // відповіді, скидається до 1 після помилки/пропуску), а позиція — наскрізний
  // offset у канах. Статичне нарізання тут непридатне, бо розмір змінний.
  const isGrowing = computed(() => growing?.value ?? false)
  const totalKana = computed(() => words.value.reduce((sum, word) => sum + word.length, 0))
  const doneKana = ref(0)
  const growSize = ref(1)

  const chunks = computed(() =>
    isGrowing.value ? [] : chunkKanaByWords(words.value, chunkSize.value),
  )
  const total = computed(() => (isGrowing.value ? totalKana.value : chunks.value.length))

  const index = ref(0)
  const outcomes = ref<Array<DrillOutcome | null>>([])

  const lastOutcome = ref<DrillOutcome | null>(null)
  const lastAnswer = ref('')

  const currentChunk = computed(() =>
    isGrowing.value
      ? takeChunk(words.value, doneKana.value, growSize.value)
      : (chunks.value[index.value] ?? []),
  )
  const expectedKana = computed(() => currentChunk.value.join(''))
  const expectedRomaji = computed(() => currentChunk.value.map(kanaToRomaji).join(''))
  const isFinished = computed(() =>
    isGrowing.value
      ? totalKana.value > 0 && doneKana.value >= totalKana.value
      : total.value > 0 && index.value >= total.value,
  )
  const correctCount = computed(() => outcomes.value.filter((o) => o === 'correct').length)
  const answeredCount = computed(
    () => outcomes.value.filter((o) => o === 'correct' || o === 'wrong').length,
  )

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

  // Record an outcome the caller has already decided (e.g. the writing format,
  // where correctness comes from trace coverage rather than text matching).
  const submitOutcome = (outcome: DrillOutcome, answer = ''): DrillOutcome => {
    record(outcome, answer)
    return outcome
  }

  const next = () => {
    lastOutcome.value = null
    lastAnswer.value = ''
    if (isGrowing.value) {
      const len = currentChunk.value.length
      const outcome = outcomes.value[index.value]
      doneKana.value += Math.max(1, len)
      // Розмір наступного шматка визначає щойно завершена картка: пропуск
      // (без outcome) теж скидає серію — рости можна лише відповідаючи.
      growSize.value = outcome === 'correct' ? growSize.value + 1 : 1
      index.value += 1
      return
    }
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
    doneKana.value = 0
    growSize.value = 1
  }

  return {
    chunks,
    total,
    index,
    doneKana,
    growSize,
    answeredCount,
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
  }
}
