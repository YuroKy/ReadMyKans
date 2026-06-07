<script setup lang="ts">
import type { KanaAnalysis } from '../types'

defineProps<{
  analysis: KanaAnalysis
}>()
</script>

<template>
  <section class="panel kana-stats">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Кана</p>
        <h2>Розбір символів</h2>
      </div>
    </div>

    <div class="stat-grid">
      <div class="mini-stat">
        <span>Хіраґана</span>
        <strong>{{ analysis.hiraganaCount }}</strong>
      </div>
      <div class="mini-stat">
        <span>Катакана</span>
        <strong>{{ analysis.katakanaCount }}</strong>
      </div>
      <div class="mini-stat">
        <span>Унікальна кана</span>
        <strong>{{ analysis.uniqueKana.length }}</strong>
      </div>
    </div>

    <div class="chip-section">
      <h3>Використано</h3>
      <div v-if="analysis.uniqueKana.length" class="kana-chip-list">
        <span v-for="kana in analysis.uniqueKana" :key="kana" class="kana-chip">{{ kana }}</span>
      </div>
      <p v-else class="empty-copy">Кана зʼявиться тут після введення японського тексту.</p>
    </div>

    <div class="chip-section">
      <h3>Найчастіше</h3>
      <div v-if="analysis.mostFrequentKana.length" class="frequency-list">
        <span v-for="item in analysis.mostFrequentKana" :key="item.kana">
          <b>{{ item.kana }}</b>
          {{ item.count }}
        </span>
      </div>
      <p v-else class="empty-copy">Поки немає даних.</p>
    </div>
  </section>
</template>
