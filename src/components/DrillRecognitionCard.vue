<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import {
  startDrillSpeech,
  isDrillSpeechSupported,
  type DrillSpeechSession,
} from '../composables/useDrillSpeech'
import { usePushToTalk } from '../composables/usePushToTalk'
import { isWeak, topConfusion } from '../composables/useKanaStats'
import { kanaToRomaji } from '../utils/romaji'
import { kanaContrast } from '../utils/kanaContrast'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{ deck: DrillDeck }>()
const {
  expectedKana,
  expectedRomaji,
  currentChunk,
  lastOutcome,
  lastAnswer,
  lastConfused,
  isSingleKana,
  stats,
  index,
  sessionToken,
  answerRomaji,
  answerVoice,
  retry,
  skip,
} = props.deck

const answer = ref('')
const revealed = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const focusInput = () => nextTick(() => inputEl.value?.focus())

watch([index, sessionToken], () => {
  answer.value = ''
  revealed.value = false
  focusInput()
})

const submit = () => {
  if (lastOutcome.value || !answer.value.trim()) return
  answerRomaji(answer.value)
}

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
    return text
  },
  canStart: () => !lastOutcome.value && micSupported,
  onResult: (text) => {
    answerVoice(text)
  },
})

const micLabel = computed(() => {
  switch (micState.value) {
    case 'connecting':
      return 'Запуск мікрофона…'
    case 'listening':
      return 'Кажіть кану…'
    case 'processing':
      return 'Обробка…'
    default:
      return 'Натисни і скажи'
  }
})

const onMicPointerDown = (e: PointerEvent) => {
  try {
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  } catch {}
  void micPress()
}

onBeforeUnmount(() => session?.stop())

const tryAgain = () => {
  retry()
  answer.value = ''
  focusInput()
}

const ttsSupported = isSpeechSynthesisSupported()
const speak = () => speakKana(expectedKana.value, { rate: 0.7 })

const youSaidRomaji = computed(() => lastAnswer.value)

const currentStat = computed(() => stats.statFor(expectedKana.value))
const weakBadge = computed(() => isSingleKana.value && isWeak(currentStat.value))
const confusionHint = computed(() => (isSingleKana.value ? topConfusion(currentStat.value) : ''))

const contrast = computed(() =>
  lastOutcome.value === 'wrong' && lastConfused.value
    ? kanaContrast(expectedKana.value, lastConfused.value)
    : null,
)

onMounted(() => focusInput())
</script>

<template>
  <section
    class="panel drill-card"
    :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
  >
    <SakuraDecor />
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

    <div v-if="!lastOutcome && (weakBadge || confusionHint)" class="drill-cues">
      <span v-if="weakBadge" class="drill-cue warn">⚠️ Тут часто буває помилка</span>
      <span v-if="confusionHint" class="drill-cue confuse">
        💡 Не сплутай з <b>{{ confusionHint }}</b>
      </span>
    </div>

    <p v-if="revealed && !lastOutcome" class="drill-hint">
      Підказка: <b>{{ expectedRomaji }}</b>
    </p>

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

    <div v-if="!lastOutcome && micSupported" class="drill-ptt">
      <span class="drill-or">або</span>
      <button
        type="button"
        class="drill-mic"
        :class="{
          active: micState === 'listening',
          busy: micState === 'connecting' || micState === 'processing',
        }"
        aria-label="Тримай і говори"
        @pointerdown.prevent="onMicPointerDown"
        @pointerup="micRelease"
        @pointercancel="micRelease"
      >
        <svg class="drill-mic-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" />
          <path
            d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <span class="drill-mic-label">{{ micLabel }}</span>
      <span class="drill-ptt-hint">Утримуй кнопку, скажи кану, відпусти</span>
    </div>

    <div v-if="!lastOutcome" class="drill-sub-actions">
      <button class="ghost-button small" type="button" @click="revealed = true">
        Показати підказку
      </button>
      <button class="ghost-button small" type="button" @click="skip">Пропустити</button>
    </div>

    <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
      <strong>✓ Правильно!</strong>
      <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
    </div>

    <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
      <strong>✗ Не зараховано</strong>
      <span>Ви назвали: <b>{{ youSaidRomaji || '—' }}</b></span>
      <span>Правильно: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span>

      <p v-if="contrast" class="drill-contrast">
        {{ contrast.note }}
      </p>

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip">Далі</button>
      </div>
    </div>

    <div v-if="lastOutcome && currentChunk.length > 1" class="drill-breakdown">
      <span v-for="(k, i) in currentChunk" :key="i" class="drill-kana-chip">
        {{ k }}<small>{{ kanaToRomaji(k) }}</small>
      </span>
    </div>
  </section>
</template>
