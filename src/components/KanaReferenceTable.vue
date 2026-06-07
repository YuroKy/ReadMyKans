<script setup lang="ts">
import { ref } from 'vue'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'

const isOpen = ref(false)
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

    <div v-if="isOpen" class="reference-grid">
      <div>
        <h3>Хіраґана</h3>
        <div class="kana-table">
          <template v-for="(row, rowIndex) in HIRAGANA_ROWS" :key="`h-${rowIndex}`">
            <span
              v-for="(kana, cellIndex) in row"
              :key="`h-${rowIndex}-${cellIndex}`"
              :class="{ blank: !kana }"
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
              :class="{ blank: !kana }"
            >
              {{ kana || '·' }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>
