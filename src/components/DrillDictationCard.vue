<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import { useDrillPrefs } from '../composables/useDrillPrefs'
import { kanaToRomaji } from '../utils/romaji'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import SakuraDecor from './SakuraDecor.vue'
import DrillTimerBar from './DrillTimerBar.vue'
import KanaText from './KanaText.vue'

const props = defineProps<{ deck: DrillDeck }>()
const {
  expectedKana,
  expectedRomaji,
  currentChunk,
  lastOutcome,
  lastAnswer,
  currentTranslation,
  currentDisplay,
  index,
  sessionToken,
  answerRomaji,
  retry,
  skip,
  timerEnabled,
  timerDurationMs,
  timerGeneration,
} = props.deck

const answer = ref('')
const revealed = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

// Хардкор: одне прослуховування на картку, без «Показати кану», опційно
// швидша вимова. Автоплей нової картки рахується як прослуховування №1.
const { prefs } = useDrillPrefs()
const hardcore = computed(() => prefs.value.dictationHardcore)
const playsUsed = ref(0)
const canReplay = computed(() => !hardcore.value || playsUsed.value < 1)

const ttsSupported = isSpeechSynthesisSupported()
const play = () => {
  const rate = hardcore.value ? prefs.value.dictationRate * 0.85 : 0.85
  if (speakKana(expectedKana.value, { rate })) playsUsed.value += 1
}
const replay = () => {
  if (canReplay.value) play()
}
const focusInput = () => nextTick(() => inputEl.value?.focus())

const skipCards = (count = 1) => skip(count)

// Фокус повертається в інпут на кожній зміні картки: на мобільному ніколи
// не доводиться тапати інпут повторно — клавіатура лишається відкритою.
const resetCard = () => {
  answer.value = ''
  revealed.value = false
  playsUsed.value = 0
  focusInput()
  // Auto-play the new card so the learner hears it without an extra tap.
  play()
}

watch([index, sessionToken], resetCard)

const submit = () => {
  if (lastOutcome.value || !answer.value.trim()) return
  // Refocus синхронно в жесті: тап по «Перевірити» крадe фокус, а пізніший
  // programmatic focus() поза жестом не відкриє клавіатуру на iOS.
  inputEl.value?.focus()
  answerRomaji(answer.value)
}

const tryAgain = () => {
  retry()
  answer.value = ''
  focusInput()
  // У хардкорі друга спроба йде з пам'яті — без повторного програвання.
  if (!hardcore.value) play()
}

onMounted(() => {
  focusInput()
  play()
})
</script>

<template>
  <section
    class="panel drill-card"
    :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
  >
    <SakuraDecor />
    <DrillTimerBar
      v-if="timerEnabled && !lastOutcome"
      :duration="timerDurationMs"
      :generation="timerGeneration"
    />
    <div class="drill-kana-row">
      <button
        class="drill-audio-button"
        type="button"
        :disabled="!ttsSupported || (!canReplay && !lastOutcome)"
        title="Прослухати"
        aria-label="Прослухати кану"
        @click="replay"
      >
        <span v-if="lastOutcome"><KanaText :text="expectedKana" /></span>
        <span v-else aria-hidden="true">🔊</span>
      </button>
    </div>

    <p v-if="!ttsSupported" class="drill-dictation-warn">
      Синтез мовлення недоступний у цьому браузері — диктант не працюватиме.
    </p>
    <p v-else class="drill-dictation-hint">Прослухай і запиши ромадзі</p>

    <p v-if="revealed && !lastOutcome" class="drill-hint">
      Підказка: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b>
    </p>

    <!-- Інпут лишається змонтованим під час «правильно»-паузи (800 мс), щоб
         фокус і мобільна клавіатура не губилися між картками. -->
    <form v-if="lastOutcome !== 'wrong'" class="drill-input-row" @submit.prevent="submit">
      <input
        ref="inputEl"
        v-model="answer"
        class="mic-select drill-input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="go"
        placeholder="Введіть ромадзі того, що почули"
      >
      <button class="primary-button" type="submit" :disabled="!answer.trim() || !!lastOutcome">
        Перевірити
      </button>
    </form>

    <div v-if="!lastOutcome" class="drill-sub-actions">
      <button
        class="ghost-button small"
        type="button"
        :disabled="!ttsSupported || !canReplay"
        :title="canReplay ? '' : 'Хардкор: одне прослуховування'"
        @click="replay"
      >
        {{ canReplay ? '🔁 Ще раз' : '🔇 Було одне' }}
      </button>
      <button v-if="!hardcore" class="ghost-button small" type="button" @click="revealed = true">
        Показати кану
      </button>
      <button class="ghost-button small" type="button" @click="skipCards(1)">Пропустити</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 3 кани" @click="skipCards(3)">×3</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 5 кан" @click="skipCards(5)">×5</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 10 кан" @click="skipCards(10)">×10</button>
    </div>

    <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
      <strong>✓ Правильно!</strong>
      <span>{{ currentDisplay ? `${currentDisplay} = ` : '' }}{{ expectedKana }} = {{ expectedRomaji }}</span>
      <span v-if="currentTranslation">📖 {{ currentTranslation }}</span>
    </div>

    <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
      <strong>✗ Не зараховано</strong>
      <span>Ви ввели: <b>{{ lastAnswer || '—' }}</b></span>
      <span>Правильно: <b v-if="currentDisplay">{{ currentDisplay }}</b> <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span>
      <span v-if="currentTranslation">📖 {{ currentTranslation }}</span>

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip()">Далі</button>
      </div>
    </div>

    <div v-if="lastOutcome && currentChunk.length > 1" class="drill-breakdown">
      <span v-for="(k, i) in currentChunk" :key="i" class="drill-kana-chip">
        {{ k }}<small>{{ kanaToRomaji(k) }}</small>
      </span>
    </div>
  </section>
</template>

<style scoped>
.drill-audio-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 0;
  border-radius: 32px;
  background: var(--rose);
  color: var(--primary);
  font-size: 3rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.12s ease, background 0.15s ease;
}

.drill-audio-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.drill-audio-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drill-dictation-hint {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.drill-dictation-warn {
  margin: 0;
  color: var(--amber-strong);
  font-weight: 600;
}
</style>
