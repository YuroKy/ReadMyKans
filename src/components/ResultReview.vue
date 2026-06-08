<script setup lang="ts">
import type { ComparisonSegment, SessionResult } from '../types'
import { segmentLabel } from '../composables/useTextComparison'

defineProps<{
  result: SessionResult
}>()

const emit = defineEmits<{
  retry: []
  edit: []
  newSession: []
}>()

const formatDuration = (durationMs: number) => {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes > 0 ? `${minutes} хв ${rest} с` : `${rest} с`
}

const segmentTitle = (segment: ComparisonSegment) => segmentLabel[segment.type]
</script>

<template>
  <main class="result-layout">
    <section class="result-header">
      <div>
        <p class="eyebrow">Результат</p>
        <h1>{{ result.accuracy }}% точності</h1>
      </div>
      <div class="accuracy-ring" :style="{ '--score': `${result.accuracy}%` }">
        <span>{{ result.accuracy }}%</span>
      </div>
    </section>

    <section class="result-stats">
      <div class="panel mini-stat">
        <span>Оригінал</span>
        <strong>{{ result.originalLength }}</strong>
      </div>
      <div class="panel mini-stat">
        <span>Розпізнано</span>
        <strong>{{ result.recognizedLength }}</strong>
      </div>
      <div class="panel mini-stat">
        <span>Відмінності</span>
        <strong>{{ result.mismatchCount }}</strong>
      </div>
      <div class="panel mini-stat">
        <span>Тривалість</span>
        <strong>{{ formatDuration(result.durationMs) }}</strong>
      </div>
    </section>

    <section class="panel review-panel">
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
      <button class="secondary-button" type="button" @click="emit('retry')">
        Спробувати ще раз
      </button>
      <button class="ghost-button" type="button" @click="emit('edit')">Редагувати текст</button>
      <button class="primary-button" type="button" @click="emit('newSession')">Новий текст</button>
    </section>
  </main>
</template>
