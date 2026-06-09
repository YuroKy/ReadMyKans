<script setup lang="ts">
import { computed } from 'vue'
import type { HistoryItem } from '../types'
import { sparkline, polyline, areaPath } from '../utils/trend'

const props = defineProps<{ history: HistoryItem[] }>()

const W = 260
const H = 72

// History is stored newest-first; show oldest → newest left to right.
const values = computed(() => [...props.history].reverse().map((item) => item.accuracy))
const points = computed(() => sparkline(values.value, W, H, 0, 100))
const line = computed(() => polyline(points.value))
const area = computed(() => areaPath(points.value, H))
const hasTrend = computed(() => values.value.length >= 2)

const last = computed(() => values.value[values.value.length - 1] ?? 0)
const avg = computed(() =>
  values.value.length
    ? Math.round(values.value.reduce((sum, v) => sum + v, 0) / values.value.length)
    : 0,
)
</script>

<template>
  <section class="panel trend-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Динаміка</p>
        <h2>Точність читання</h2>
      </div>
      <div v-if="values.length" class="mastery-score">
        <strong>{{ last }}%</strong>
        <span>остання</span>
      </div>
    </div>

    <template v-if="hasTrend">
      <svg
        class="trend-svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        role="img"
        aria-label="Графік точності читання за сесіями"
      >
        <line class="trend-base" :x1="0" :y1="H / 2" :x2="W" :y2="H / 2" />
        <path class="trend-area" :d="area" />
        <polyline class="trend-line" :points="line" />
        <circle
          v-for="(p, i) in points"
          :key="i"
          class="trend-dot"
          :cx="p.x"
          :cy="p.y"
          r="2.5"
        />
      </svg>
      <p class="trend-foot">
        Середня за {{ values.length }} сесій: <b>{{ avg }}%</b>
      </p>
    </template>

    <p v-else class="empty-copy">
      Потрібно щонайменше 2 сесії читання, щоб побудувати графік. Прочитай ще трохи 🌸
    </p>
  </section>
</template>

<style scoped>
.trend-panel {
  display: grid;
  gap: 12px;
}

.trend-svg {
  width: 100%;
  height: 72px;
  overflow: visible;
}

.trend-base {
  stroke: var(--divider);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}

.trend-area {
  fill: var(--rose);
  opacity: 0.6;
}

.trend-line {
  fill: none;
  stroke: var(--primary);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.trend-dot {
  fill: var(--primary);
}

.trend-foot {
  margin: 0;
  font-size: 0.82rem;
  color: var(--muted);
}
</style>
