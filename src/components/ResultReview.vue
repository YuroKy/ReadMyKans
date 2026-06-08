<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ComparisonSegment, SessionResult } from '../types'
import { segmentLabel } from '../composables/useTextComparison'
import { analyzeKanaDifficulty } from '../utils/kanaDifficulty'
import { collectConfusions } from '../utils/confusions'
import { encouragement } from '../utils/encouragement'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{
  result: SessionResult
}>()

const emit = defineEmits<{
  retry: []
  edit: []
  newSession: []
}>()

const formatClock = (durationMs: number) => {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(rest).padStart(2, '0')
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

const segmentTitle = (segment: ComparisonSegment) => segmentLabel[segment.type]

const totalChars = computed(() => [...props.result.comparison.normalizedOriginal].length)

const correctChars = computed(() =>
  props.result.comparison.segments
    .filter((segment) => segment.type === 'correct')
    .reduce((sum, segment) => sum + [...(segment.original ?? '')].length, 0),
)

const errorChars = computed(() => Math.max(0, totalChars.value - correctChars.value))

const headline = computed(() => encouragement(props.result.accuracy))

const difficulty = computed(() => analyzeKanaDifficulty(props.result.comparison.normalizedOriginal))

const difficultyTiers = computed(() => {
  const data = difficulty.value
  const total = data.total || 1
  const pct = (value: number) => Math.round((value / total) * 100)
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

const confusions = computed(() => collectConfusions(props.result.comparison.segments, 5))

const lastFragment = computed(() => {
  const text = props.result.recognizedText.trim()
  if (!text) return ''
  const chars = [...text]
  return chars.length > 90 ? `…${chars.slice(-90).join('')}` : text
})

const errorsPanel = ref<HTMLElement | null>(null)

const scrollToErrors = () => {
  errorsPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <main class="result-layout">
    <section class="panel result-summary">
      <SakuraDecor density="rich" />
      <div class="result-summary-main">
        <div class="result-summary-head">
          <p class="eyebrow">Результати сесії</p>
          <h1>{{ headline.title }}</h1>
          <p class="result-subtitle">{{ headline.subtitle }}</p>
        </div>
        <span class="result-badge">🌸 Сесія завершена успішно!</span>
      </div>

      <div class="accuracy-ring big" :style="{ '--score': `${result.accuracy}%` }">
        <strong>{{ result.accuracy }}%</strong>
        <span>точність</span>
      </div>
    </section>

    <section class="result-stats">
      <div class="panel mini-stat">
        <span>Прочитано символів</span>
        <strong>{{ totalChars }}</strong>
      </div>
      <div class="panel mini-stat accent-ok">
        <span>Правильних символів</span>
        <strong>{{ correctChars }}</strong>
      </div>
      <div class="panel mini-stat accent-bad">
        <span>Помилок</span>
        <strong>{{ errorChars }}</strong>
      </div>
      <div class="panel mini-stat">
        <span>Тривалість сесії</span>
        <strong>{{ formatClock(result.durationMs) }}</strong>
      </div>
    </section>

    <section class="result-insights">
      <article class="panel insight-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Розбір</p>
            <h2>Складність кани</h2>
          </div>
        </div>

        <div class="difficulty-body">
          <div
            class="difficulty-donut"
            :style="{ '--donut': donutGradient }"
            role="img"
            aria-label="Розподіл кани за складністю"
          >
            <strong>{{ difficulty.total }}</strong>
            <span>кан</span>
          </div>
          <ul class="difficulty-legend">
            <li v-for="tier in difficultyTiers" :key="tier.key" :class="tier.key">
              <span class="difficulty-dot" />
              <span class="difficulty-label">{{ tier.label }}</span>
              <strong>{{ tier.count }}</strong>
              <small>({{ tier.pct }}%)</small>
            </li>
          </ul>
        </div>
      </article>

      <article class="panel insight-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Помилки</p>
            <h2>Найчастіші плутанини</h2>
          </div>
        </div>

        <ul v-if="confusions.length" class="confusion-list">
          <li v-for="pair in confusions" :key="`${pair.a}-${pair.b}`" class="confusion-row">
            <span class="confusion-pair">
              <b>{{ pair.a }}</b>
              <i>↔</i>
              <b>{{ pair.b }}</b>
            </span>
            <span class="confusion-count">{{ pair.count }}</span>
          </li>
        </ul>
        <p v-else class="empty-copy">Сплутаних пар кани не знайдено. Чисте читання! 🌸</p>
      </article>

      <article class="panel insight-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Прогрес</p>
            <h2>Останній прочитаний фрагмент</h2>
          </div>
        </div>

        <p v-if="lastFragment" class="last-fragment">{{ lastFragment }}</p>
        <p v-else class="empty-copy">Цього разу зараховано небагато. Спробуй ще раз!</p>
      </article>
    </section>

    <section ref="errorsPanel" class="panel review-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Перевірка</p>
          <h2>Порівняння тексту</h2>
        </div>
      </div>

      <div class="comparison-line" aria-label="Порівняння прочитаного тексту">
        <span
          v-for="(segment, index) in result.comparison.segments"
          :key="`${segment.type}-${index}-${segment.original}-${segment.spoken}`"
          class="comparison-segment"
          :class="segment.type"
          :title="segmentTitle(segment)"
        >
          {{ segment.original || segment.spoken }}
        </span>
      </div>

      <div class="legend-row">
        <span class="legend correct">Правильно</span>
        <span class="legend missed">Пропущено</span>
        <span class="legend mismatch">Відмінність</span>
        <span class="legend extra">Зайве</span>
      </div>
    </section>

    <section class="panel review-panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Повторення</p>
          <h2>Кана для уваги</h2>
        </div>
      </div>

      <div v-if="result.kanaToReview.length" class="review-kana-list">
        <span v-for="kana in result.kanaToReview" :key="kana">{{ kana }}</span>
      </div>
      <p v-else class="empty-copy">
        Помітних проблем із каною не знайдено. Можна перейти до нового тексту.
      </p>
    </section>

    <section class="session-actions" aria-label="Подальші дії">
      <button class="primary-button" type="button" @click="scrollToErrors">
        Переглянути помилки
      </button>
      <button class="secondary-button" type="button" @click="emit('retry')">
        Повторити ще раз
      </button>
      <button class="ghost-button" type="button" @click="emit('newSession')">На головну</button>
      <button class="ghost-button small" type="button" @click="emit('edit')">
        Редагувати текст
      </button>
    </section>
  </main>
</template>
