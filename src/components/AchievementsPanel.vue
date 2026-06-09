<script setup lang="ts">
import { computed } from 'vue'
import { ACHIEVEMENTS } from '../utils/achievements'
import { useAchievements } from '../composables/useAchievements'

const { unlocked, isUnlocked, unlockedCount } = useAchievements()
const total = ACHIEVEMENTS.length

const items = computed(() =>
  ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: isUnlocked(a.id),
    date: unlocked.value[a.id],
  })),
)
</script>

<template>
  <section class="panel achievements-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Досягнення</p>
        <h2>Бейджі</h2>
      </div>
      <div class="panel-score">
        <strong>{{ unlockedCount }}/{{ total }}</strong>
        <span>відкрито</span>
      </div>
    </div>

    <ul class="ach-grid">
      <li
        v-for="a in items"
        :key="a.id"
        class="ach-item"
        :class="{ locked: !a.unlocked }"
        :title="a.description"
      >
        <span class="ach-icon">{{ a.unlocked ? a.icon : '🔒' }}</span>
        <span class="ach-title">{{ a.title }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.ach-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ach-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--rose);
  border: 1px solid transparent;
}

.ach-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.ach-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--ink);
}

.ach-item.locked {
  background: transparent;
  border-color: var(--divider);
  opacity: 0.6;
}

.ach-item.locked .ach-title {
  color: var(--muted);
  font-weight: 600;
}
</style>
