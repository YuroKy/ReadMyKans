<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildExam, isoWeek, EXAM_SIZE, PASS_PCT, type ExamItem } from '../utils/exam'
import { checkRomajiAnswer } from '../utils/chunking'
import { kanaToRomaji, romajiToKana, kanaCharsEqual } from '../utils/romaji'
import { buildChoices } from '../utils/drillDistractors'
import { clusterFor } from '../utils/minimalPairs'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import { sparkline, polyline, areaPath } from '../utils/trend'
import { useKanaStats } from '../composables/useKanaStats'
import { useSrsSchedule } from '../composables/useSrsSchedule'
import { useExamHistory } from '../composables/useExamHistory'
import { useDailyProgress } from '../composables/useDailyProgress'
import { useToasts } from '../composables/useToasts'
import { track } from '../utils/analytics'
import SakuraDecor from './SakuraDecor.vue'

// Тижневий екзамен: 50 кан упереміш у трьох форматах, без підказок, без
// пропусків, одна спроба на ISO-тиждень. Свідомо не на useDrillDeck — у деки
// persisted-формат і вшиті retry/skip, яких екзамен не дозволяє.

const emit = defineEmits<{ exit: []; finish: [] }>()

const UNIVERSE = [...HIRAGANA_ROWS.flat(), ...KATAKANA_ROWS.flat()].filter(Boolean)

const stats = useKanaStats()
const { schedule, record: srsRecord } = useSrsSchedule()
const { records, add: addRecord } = useExamHistory()
const daily = useDailyProgress()
const toasts = useToasts()

const ttsSupported = isSpeechSynthesisSupported()

const status = ref<'idle' | 'running' | 'finished'>('idle')
const items = ref<ExamItem[]>([])
const idx = ref(0)
const correct = ref(0)
const answer = ref('')
const flash = ref<'ok' | 'bad' | null>(null)
const choices = ref<string[]>([])

const current = computed(() => items.value[idx.value])
const accuracy = computed(() =>
  items.value.length === 0 ? 0 : Math.round((correct.value / items.value.length) * 100),
)
const passed = computed(() => accuracy.value >= PASS_PCT)

// Графік минулих спроб (SVG-спарклайн на чистих хелперах trend.ts).
const SPARK_W = 220
const SPARK_H = 48
const historyPoints = computed(() =>
  sparkline(records.value.map((r) => r.accuracy), SPARK_W, SPARK_H, 0, 100),
)
const historyLine = computed(() => polyline(historyPoints.value))
const historyArea = computed(() => areaPath(historyPoints.value, SPARK_H))

const prepareCard = () => {
  answer.value = ''
  flash.value = null
  const item = current.value
  if (!item) return
  if (item.format === 'choice') {
    choices.value = buildChoices(item.kana, {
      confusions: [
        ...Object.keys(stats.statFor(item.kana).confusedWith),
        ...clusterFor(item.kana),
      ],
      count: 3,
    })
  }
  if (item.format === 'dictation') speakKana(item.kana, { rate: 0.85 })
}

const begin = () => {
  items.value = buildExam(
    UNIVERSE,
    stats.stats.value,
    schedule.value,
    undefined,
    Math.random,
    ttsSupported,
  )
  idx.value = 0
  correct.value = 0
  status.value = 'running'
  track('exam-start', { items: items.value.length })
  prepareCard()
}

const finishExam = () => {
  status.value = 'finished'
  const record = {
    week: isoWeek(),
    date: new Date().toISOString(),
    correct: correct.value,
    total: items.value.length,
    accuracy: accuracy.value,
    passed: passed.value,
  }
  addRecord(record)
  track('exam-finish', { accuracy: accuracy.value, passed: passed.value })
  toasts.push(
    passed.value
      ? { icon: '🎓', title: 'Екзамен складено!', text: `${correct.value}/${items.value.length}. Можна пишатися. До наступного тижня.` }
      : {
          icon: '📉',
          title: `${correct.value}/${items.value.length} — не складено`,
          text: 'Майже як знати кану. Побачимось наступного тижня.',
        },
  )
  emit('finish')
}

const settle = (ok: boolean, confused?: string) => {
  const item = current.value
  if (!item || flash.value) return
  stats.record(item.kana, ok, ok ? undefined : confused)
  srsRecord(item.kana, ok)
  daily.add(1)
  if (ok) correct.value += 1
  flash.value = ok ? 'ok' : 'bad'
  window.setTimeout(() => {
    idx.value += 1
    if (idx.value >= items.value.length) finishExam()
    else prepareCard()
  }, 600)
}

const submitRomaji = () => {
  const item = current.value
  const raw = answer.value.trim()
  if (!item || !raw || flash.value) return
  const confused = romajiToKana(raw)
  settle(checkRomajiAnswer(item.kana, raw), confused && confused !== item.kana ? confused : undefined)
}

const chooseTile = (tile: string) => {
  const item = current.value
  if (!item || flash.value) return
  settle(kanaCharsEqual(tile, item.kana), tile)
}

const replayDictation = () => {
  // Екзамен — без повторів: кнопка лише для початкового програвання, якщо
  // браузер заблокував автоплей до взаємодії користувача.
  const item = current.value
  if (item?.format === 'dictation' && !answer.value) speakKana(item.kana, { rate: 0.85 })
}
</script>

<template>
  <main class="exam-layout">
    <section class="session-hero">
      <SakuraDecor />
      <div>
        <p class="eyebrow">Раз на тиждень</p>
        <h1>🎓 Екзамен</h1>
      </div>
      <button class="ghost-button small" type="button" @click="emit('exit')">Вийти</button>
    </section>

    <section v-if="status === 'idle'" class="panel exam-intro">
      <h2>{{ EXAM_SIZE }} кан. Без підказок. Без пропусків. Одна спроба.</h2>
      <p class="muted">
        Розпізнавання, диктант і вибір упереміш. Прохідний бал — {{ PASS_PCT }}%.
        Наступна спроба — наступного тижня, незалежно від результату.
      </p>
      <div v-if="records.length" class="exam-history">
        <span class="eyebrow">Минулі спроби</span>
        <svg :viewBox="`0 0 ${SPARK_W} ${SPARK_H}`" class="exam-spark" aria-hidden="true">
          <path :d="historyArea" class="exam-spark-area" />
          <polyline :points="historyLine" class="exam-spark-line" fill="none" />
        </svg>
        <span class="muted compact">
          Остання: {{ records[records.length - 1]!.accuracy }}%
          {{ records[records.length - 1]!.passed ? '🎓' : '📉' }}
        </span>
      </div>
      <button class="primary-button" type="button" @click="begin">Розпочати</button>
    </section>

    <section
      v-else-if="status === 'running' && current"
      class="panel exam-card"
      :class="{ ok: flash === 'ok', bad: flash === 'bad' }"
    >
      <div class="exam-progress">
        <span class="eyebrow">Білет {{ idx + 1 }} / {{ items.length }}</span>
        <strong>{{ correct }} ✓</strong>
      </div>

      <template v-if="current.format === 'recognition'">
        <strong class="exam-kana" lang="ja">{{ current.kana }}</strong>
        <form class="drill-input-row" @submit.prevent="submitRomaji">
          <input
            v-model="answer"
            class="mic-select drill-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Ромадзі"
          >
          <button class="primary-button" type="submit" :disabled="!answer.trim()">Відповісти</button>
        </form>
      </template>

      <template v-else-if="current.format === 'dictation'">
        <button class="exam-audio" type="button" title="Прослухати" @click="replayDictation">🔊</button>
        <form class="drill-input-row" @submit.prevent="submitRomaji">
          <input
            v-model="answer"
            class="mic-select drill-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Що прозвучало? (ромадзі)"
          >
          <button class="primary-button" type="submit" :disabled="!answer.trim()">Відповісти</button>
        </form>
      </template>

      <template v-else>
        <strong class="exam-romaji">{{ kanaToRomaji(current.kana) }}</strong>
        <div class="sprint-grid" role="group" aria-label="Варіанти кани">
          <button
            v-for="tile in choices"
            :key="tile + current.kana"
            type="button"
            class="sprint-tile"
            @click="chooseTile(tile)"
          >
            {{ tile }}
          </button>
        </div>
      </template>

      <p class="exam-flash" aria-live="polite">
        <span v-if="flash === 'ok'" class="ok-mark">✓</span>
        <span v-else-if="flash === 'bad'" class="bad-mark">✗</span>
        <span v-else>&nbsp;</span>
      </p>
    </section>

    <section v-else-if="status === 'finished'" class="panel exam-result">
      <SakuraDecor density="rich" />
      <p class="eyebrow">{{ passed ? 'Складено' : 'Не складено' }}</p>
      <h1>{{ passed ? '🎓 Вітаю!' : '📉 Не цього разу' }}</h1>
      <div class="accuracy-ring big" :style="{ '--score': `${accuracy}%` }">
        <strong>{{ accuracy }}%</strong>
        <span>{{ correct }} / {{ items.length }}</span>
      </div>
      <p class="muted">
        {{ passed ? 'Наступний екзамен — наступного тижня. Тримай планку.' : `Прохідний бал ${PASS_PCT}%. Наступна спроба — наступного тижня. Часу вдосталь.` }}
      </p>
      <button class="secondary-button" type="button" @click="emit('exit')">На головну</button>
    </section>
  </main>
</template>

<style scoped>
.exam-layout {
  display: grid;
  gap: 18px;
}

.exam-intro,
.exam-result {
  position: relative;
  display: grid;
  gap: 14px;
  justify-items: start;
  padding: 26px;
}

.exam-result {
  justify-items: center;
  text-align: center;
}

.exam-intro h2 {
  margin: 0;
}

.exam-history {
  display: grid;
  gap: 6px;
}

.exam-spark {
  width: 220px;
  height: 48px;
}

.exam-spark-line {
  stroke: var(--primary);
  stroke-width: 2;
}

.exam-spark-area {
  fill: var(--rose);
  opacity: 0.6;
}

.exam-card {
  display: grid;
  gap: 16px;
  justify-items: center;
  padding: 26px;
  transition: box-shadow 0.2s ease;
}

.exam-card.ok {
  box-shadow: 0 0 0 3px var(--mint-strong);
}

.exam-card.bad {
  box-shadow: 0 0 0 3px var(--rose-strong);
}

.exam-progress {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.exam-kana {
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 4.4rem;
  font-weight: 800;
  color: var(--ink);
}

.exam-romaji {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.exam-audio {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border: 0;
  border-radius: 28px;
  background: var(--rose);
  color: var(--primary);
  font-size: 2.4rem;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.exam-flash {
  margin: 0;
  height: 1.4rem;
  font-size: 1.3rem;
  font-weight: 800;
}

.exam-flash .ok-mark {
  color: var(--mint-strong);
}

.exam-flash .bad-mark {
  color: var(--rose-strong);
}
</style>
