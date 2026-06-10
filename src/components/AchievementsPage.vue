<script setup lang="ts">
import { computed } from 'vue'
import { ACHIEVEMENTS } from '../utils/achievements'
import { useAchievements } from '../composables/useAchievements'
import { useProgressSnapshot } from '../composables/useProgressSnapshot'
import SakuraDecor from './SakuraDecor.vue'
import AchievementIcon from './AchievementIcon.vue'

const emit = defineEmits<{ exit: [] }>()

const { unlocked, isUnlocked, unlockedCount } = useAchievements()
const { build } = useProgressSnapshot()

// Снапшот один раз на вхід: сторінка — вітрина, не лайв-дешборд.
const snapshot = build()

const formatDate = (iso: string | undefined): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

const items = computed(() =>
  ACHIEVEMENTS.map((a) => {
    const progress = a.progress?.(snapshot)
    return {
      ...a,
      unlocked: isUnlocked(a.id),
      date: formatDate(unlocked.value[a.id]),
      progress,
      progressPct:
        progress && progress.target > 0
          ? Math.min(100, Math.round((progress.current / progress.target) * 100))
          : null,
    }
  }),
)
</script>

<template>
  <main class="ach-page">
    <section class="session-hero">
      <SakuraDecor density="rich" />
      <div>
        <p class="eyebrow">Зала слави</p>
        <h1>🏆 Досягнення</h1>
        <p class="ach-page-sub">Відкрито {{ unlockedCount }} з {{ ACHIEVEMENTS.length }}</p>
      </div>
      <button class="ghost-button small" type="button" @click="emit('exit')">← На головну</button>
    </section>

    <section class="ach-page-grid">
      <article
        v-for="a in items"
        :key="a.id"
        class="panel ach-card"
        :class="{ locked: !a.unlocked }"
      >
        <AchievementIcon :id="a.id" :icon="a.icon" :unlocked="a.unlocked" :size="52" />
        <div class="ach-card-body">
          <h2>{{ a.title }}</h2>
          <p>{{ a.description }}</p>
          <p v-if="a.unlocked && a.date" class="ach-card-date">Відкрито {{ a.date }}</p>
          <div v-else-if="!a.unlocked && a.progressPct !== null" class="ach-card-progress">
            <div class="ach-progress-track">
              <div class="ach-progress-fill" :style="{ width: `${a.progressPct}%` }" />
            </div>
            <small>{{ a.progress!.current }} / {{ a.progress!.target }}</small>
          </div>
          <p v-else-if="!a.unlocked" class="ach-card-date muted">Ще не відкрито</p>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.ach-page {
  display: grid;
  gap: 18px;
}

.ach-page-sub {
  margin: 6px 0 0;
  color: var(--muted);
  font-weight: 600;
}

.ach-page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.ach-card {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 18px;
}

.ach-card.locked {
  opacity: 0.75;
}

.ach-card-body {
  display: grid;
  gap: 6px;
}

.ach-card-body h2 {
  margin: 0;
  font-size: 1.05rem;
}

.ach-card-body p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--muted);
}

.ach-card-date {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--mint-strong);
}

.ach-card-progress {
  display: grid;
  gap: 4px;
}

.ach-progress-track {
  height: 6px;
  border-radius: 999px;
  background: var(--surface-inset);
  overflow: hidden;
}

.ach-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--grad-primary);
}

.ach-card-progress small {
  color: var(--muted);
  font-weight: 600;
}
</style>
