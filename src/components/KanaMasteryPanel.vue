<script setup lang="ts">
import { computed, ref } from 'vue'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import { useKanaStats } from '../composables/useKanaStats'
import { classifyMastery, masteryLabel, MASTERY_TIERS, masterySummary } from '../utils/kanaMastery'

const { stats, statFor } = useKanaStats()

const universe = [...HIRAGANA_ROWS.flat(), ...KATAKANA_ROWS.flat()].filter(Boolean)
const summary = computed(() => masterySummary(stats.value, universe))

const script = ref<'hiragana' | 'katakana'>('hiragana')
const rows = computed(() => (script.value === 'hiragana' ? HIRAGANA_ROWS : KATAKANA_ROWS))

const tierClass = (kana: string): string => {
  if (!kana) return ''
  void stats.value // keep the cell reactive to stat changes
  return `mastery-${classifyMastery(statFor(kana))}`
}
</script>

<template>
  <section class="panel kana-mastery">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Прогрес</p>
        <h2>Опанування кани</h2>
      </div>
      <div class="panel-score">
        <strong>{{ summary.masteredPct }}%</strong>
        <span>засвоєно</span>
      </div>
    </div>

    <ul class="mastery-legend">
      <li v-for="tier in MASTERY_TIERS" :key="tier" :class="`mastery-${tier}`">
        <span class="legend-swatch" />
        {{ masteryLabel[tier] }}
        <b>{{ summary[tier] }}</b>
      </li>
    </ul>

    <div class="mastery-script-toggle">
      <button type="button" :class="{ active: script === 'hiragana' }" @click="script = 'hiragana'">
        Хіраґана
      </button>
      <button type="button" :class="{ active: script === 'katakana' }" @click="script = 'katakana'">
        Катакана
      </button>
    </div>

    <div class="kana-table">
      <template v-for="(row, rowIndex) in rows" :key="`m-${rowIndex}`">
        <span
          v-for="(kana, cellIndex) in row"
          :key="`m-${rowIndex}-${cellIndex}`"
          :class="[{ blank: !kana }, tierClass(kana)]"
        >
          {{ kana || '·' }}
        </span>
      </template>
    </div>
  </section>
</template>

<style scoped>
.mastery-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.mastery-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
}

.mastery-legend li b {
  color: var(--ink);
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background: var(--swatch, #fdeef3);
}

.mastery-script-toggle {
  display: inline-flex;
  border-radius: 999px;
  background: var(--surface-inset);
  padding: 3px;
  gap: 2px;
  margin: 14px 0 4px;
}

.mastery-script-toggle button {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.mastery-script-toggle button.active {
  background: var(--surface-raised);
  color: var(--primary);
  box-shadow: var(--shadow);
}
</style>
