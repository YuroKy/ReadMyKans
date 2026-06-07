<script setup lang="ts">
import type { HistoryItem } from '../types'

defineProps<{
  history: HistoryItem[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const formatDuration = (durationMs: number) => {
  const seconds = Math.max(0, Math.round(durationMs / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes > 0 ? `${minutes} хв ${rest} с` : `${rest} с`
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
</script>

<template>
  <section class="panel history-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Історія</p>
        <h2>Останні сесії</h2>
      </div>
      <button v-if="history.length" class="ghost-button small" type="button" @click="emit('clear')">
        Очистити
      </button>
    </div>

    <div v-if="history.length" class="history-list">
      <article v-for="item in history" :key="item.id" class="history-item">
        <div>
          <strong>{{ item.accuracy }}%</strong>
          <span>{{ formatDate(item.date) }} · {{ formatDuration(item.durationMs) }}</span>
        </div>
        <p>{{ item.preview }}</p>
        <div v-if="item.kanaToReview.length" class="tiny-kana-list">
          <span v-for="kana in item.kanaToReview" :key="`${item.id}-${kana}`">{{ kana }}</span>
        </div>
      </article>
    </div>

    <p v-else class="empty-copy">
      Після завершення читання тут збережуться до 10 останніх результатів.
    </p>
  </section>
</template>
