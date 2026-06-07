<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useKanaDrill } from '../composables/useKanaDrill'
import { startDrillSpeech, isDrillSpeechSupported, type DrillSpeechSession } from '../composables/useDrillSpeech'
import { usePushToTalk } from '../composables/usePushToTalk'
import { kanaToRomaji } from '../utils/romaji'
import { toReadingHiragana } from '../utils/reading'

const props = defineProps<{ sourceText: string }>()
const emit = defineEmits<{ exit: [] }>()

const chunkSize = ref(1)
const sourceRef = computed(() => props.sourceText)

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
  next,
  retry,
  reset,
} = useKanaDrill(sourceRef, chunkSize)

const answer = ref('')
const revealed = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const focusInput = () => nextTick(() => inputEl.value?.focus())

// Нова картка → чистимо ввід і фокусуємось
watch(index, () => {
  answer.value = ''
  revealed.value = false
  focusInput()
})

watch(chunkSize, () => {
  reset()
  answer.value = ''
  revealed.value = false
  focusInput()
})

// Спільна обробка результату (для вводу й для голосу)
const handleOutcome = (outcome: 'correct' | 'wrong') => {
  if (outcome === 'correct') {
    window.setTimeout(() => {
      if (!isFinished.value) next()
      else lastOutcome.value = null
    }, 800)
  }
}

const submit = () => {
  if (lastOutcome.value || !answer.value.trim()) return
  handleOutcome(submitRomaji(answer.value))
}

// ── Push-to-talk (голос) — напряму через Web Speech API ──────────────────────
const micSupported = isDrillSpeechSupported()
let session: DrillSpeechSession | null = null

const {
  state: micState,
  press: micPress,
  release: micRelease,
} = usePushToTalk({
  start: () => {
    session = startDrillSpeech()
    return session.started
  },
  recognize: async () => {
    if (!session) return ''
    session.stop()
    const text = await session.result
    session = null
    return toReadingHiragana(text)
  },
  canStart: () => !lastOutcome.value && micSupported,
  onResult: (kana) => handleOutcome(submitKana(kana)),
})

const micLabel = computed(() => {
  switch (micState.value) {
    case 'connecting':
      return 'Запуск мікрофона…'
    case 'listening':
      return '🔴 Кажіть кану…'
    case 'processing':
      return 'Обробка…'
    default:
      return '🎤 Тримай і кажи'
  }
})

// Pointer capture: pointerup приходить навіть якщо курсор зійшов із кнопки —
// тому запис не скасовується передчасно (на відміну від mouseleave).
const onMicPointerDown = (e: PointerEvent) => {
  // setPointerCapture може кинути виняток — не даємо йому заблокувати micPress
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {
    /* ігноруємо — не критично */
  }
  void micPress()
}

onBeforeUnmount(() => session?.stop())

const tryAgain = () => {
  retry()
  answer.value = ''
  focusInput()
}

const skip = () => {
  next()
}

const restart = () => {
  reset()
  answer.value = ''
  revealed.value = false
  focusInput()
}

// ── TTS «послухати» ──────────────────────────────────────────────────────────
const ttsSupported = computed(
  () => typeof window !== 'undefined' && 'speechSynthesis' in window,
)

const speak = () => {
  if (!ttsSupported.value || !expectedKana.value) return
  const u = new SpeechSynthesisUtterance(expectedKana.value)
  const jaVoice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith('ja'))
  u.lang = 'ja-JP'
  u.rate = 0.7
  if (jaVoice) u.voice = jaVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

const chunkLabel = computed(() => {
  const n = chunkSize.value
  if (n === 1) return '1 кана'
  if (n >= 2 && n <= 4) return `${n} кани`
  return `${n} кан`
})

const youSaidRomaji = computed(() => {
  // lastAnswer для ромадзі-вводу = те що ввели
  return lastAnswer.value
})

onMounted(() => focusInput())
</script>

<template>
  <main class="drill-layout">
    <section class="session-hero drill-hero">
      <div>
        <p class="eyebrow">Тренування кани</p>
        <h1>Дрил вимови</h1>
      </div>
      <div class="drill-controls">
        <label class="drill-size">
          <span class="eyebrow">Розмір шматка: {{ chunkLabel }}</span>
          <input type="range" min="1" max="5" step="1" v-model.number="chunkSize" class="mic-gain-slider" />
        </label>
        <button class="ghost-button small" type="button" @click="emit('exit')">Вийти</button>
      </div>
    </section>

    <!-- Прогрес -->
    <section class="panel drill-progress">
      <span>Картка {{ Math.min(index + 1, total) }} / {{ total }}</span>
      <strong>{{ correctCount }} правильних</strong>
    </section>

    <!-- Завершено -->
    <section v-if="isFinished" class="panel drill-card drill-done">
      <p class="eyebrow">Готово 🎉</p>
      <h2>{{ correctCount }} / {{ total }} правильних</h2>
      <div class="drill-actions">
        <button class="primary-button" type="button" @click="restart">Спочатку</button>
        <button class="ghost-button" type="button" @click="emit('exit')">До тексту</button>
      </div>
    </section>

    <!-- Картка -->
    <section
      v-else
      class="panel drill-card"
      :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
    >
      <div class="drill-kana-row">
        <strong class="drill-kana">{{ expectedKana || '—' }}</strong>
        <button
          class="speaker-button"
          type="button"
          :disabled="!ttsSupported"
          title="Послухати вимову"
          aria-label="Послухати вимову"
          @click="speak"
        >
          ▷
        </button>
      </div>

      <p v-if="revealed && !lastOutcome" class="drill-hint">
        Підказка: <b>{{ expectedRomaji }}</b>
      </p>

      <!-- Ввід -->
      <form v-if="!lastOutcome" class="drill-input-row" @submit.prevent="submit">
        <input
          ref="inputEl"
          v-model="answer"
          class="mic-select drill-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Введіть ромадзі (напр. mu)"
        />
        <button class="primary-button" type="submit" :disabled="!answer.trim()">Перевірити</button>
      </form>

      <!-- Голос: тримай і кажи -->
      <div v-if="!lastOutcome && micSupported" class="drill-ptt">
        <span class="drill-or">або</span>
        <button
          type="button"
          class="secondary-button drill-mic"
          :class="{ active: micState === 'listening' }"
          @pointerdown.prevent="onMicPointerDown"
          @pointerup="micRelease"
          @pointercancel="micRelease"
        >
          {{ micLabel }}
        </button>
        <span class="drill-ptt-hint">Тримай кнопку, скажи кану, відпусти</span>
      </div>

      <div v-if="!lastOutcome" class="drill-sub-actions">
        <button class="ghost-button small" type="button" @click="revealed = true">Показати підказку</button>
        <button class="ghost-button small" type="button" @click="skip">Пропустити</button>
      </div>

      <!-- Фідбек -->
      <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
        <strong>✓ Правильно!</strong>
        <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
      </div>

      <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
        <strong>✗ Не зараховано</strong>
        <span>Ви ввели: <b>{{ youSaidRomaji || '—' }}</b></span>
        <span>Правильно: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span>
        <div class="drill-actions">
          <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
          <button class="primary-button" type="button" @click="skip">Далі</button>
        </div>
      </div>

      <!-- Розбивка по кані (для шматка >1) -->
      <div v-if="lastOutcome && currentChunk.length > 1" class="drill-breakdown">
        <span v-for="(k, i) in currentChunk" :key="i" class="drill-kana-chip">
          {{ k }}<small>{{ kanaToRomaji(k) }}</small>
        </span>
      </div>
    </section>
  </main>
</template>
