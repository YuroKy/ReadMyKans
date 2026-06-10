<script setup lang="ts">
import { ref } from 'vue'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import { useKanaStats } from '../composables/useKanaStats'
import { classifyMastery, masteryLabel, MASTERY_TIERS } from '../utils/kanaMastery'

const isOpen = ref(false)
const showProgress = ref(false)

const { statFor } = useKanaStats()

const tierClass = (kana: string): string => {
  if (!kana || !showProgress.value) return ''
  return `mastery-${classifyMastery(statFor(kana))}`
}
</script>

<template>
  <section class="panel reference-panel">
    <button class="reference-toggle" type="button" @click="isOpen = !isOpen">
      <span>
        <span class="eyebrow">Довідник</span>
        <strong>Таблиця хіраґани й катакани</strong>
      </span>
      <span class="chevron" :class="{ open: isOpen }" aria-hidden="true">⌄</span>
    </button>

    <div v-if="isOpen" class="reference-body">
      <label class="progress-switch">
        <input v-model="showProgress" type="checkbox">
        <span>Підсвітити прогрес</span>
      </label>

      <ul v-if="showProgress" class="mastery-legend">
        <li v-for="tier in MASTERY_TIERS" :key="tier" :class="`mastery-${tier}`">
          <span class="legend-swatch" />
          {{ masteryLabel[tier] }}
        </li>
      </ul>

      <div class="reference-grid">
        <div>
          <h3>Хіраґана</h3>
          <div class="kana-table">
            <template v-for="(row, rowIndex) in HIRAGANA_ROWS" :key="`h-${rowIndex}`">
              <span
                v-for="(kana, cellIndex) in row"
                :key="`h-${rowIndex}-${cellIndex}`"
                :class="[{ blank: !kana }, tierClass(kana)]"
              >
                {{ kana || '·' }}
              </span>
            </template>
          </div>
        </div>
        <div>
          <h3>Катакана</h3>
          <div class="kana-table">
            <template v-for="(row, rowIndex) in KATAKANA_ROWS" :key="`k-${rowIndex}`">
              <span
                v-for="(kana, cellIndex) in row"
                :key="`k-${rowIndex}-${cellIndex}`"
                :class="[{ blank: !kana }, tierClass(kana)]"
              >
                {{ kana || '·' }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reference-body {
  margin-top: 18px;
  display: grid;
  gap: 14px;
}

.progress-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
}

.progress-switch input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}

.mastery-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin: 0;
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

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background: var(--swatch, #fdeef3);
}

/* Tier colours (swatch vars + grid cells) are global in base.css so the
   KanaMasteryPanel can reuse them. */
</style>
