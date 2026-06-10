<script setup lang="ts">
import { computed } from 'vue'
import { ACHIEVEMENTS } from '../utils/achievements'
import { useAchievements } from '../composables/useAchievements'

// Тизер на setup-екрані: лічильник + останні розлоки; повний каталог із
// прогресом живе на сторінці #/achievements.

const emit = defineEmits<{ open: [] }>()

const { unlocked, isUnlocked, unlockedCount } = useAchievements()
const total = ACHIEVEMENTS.length

// Останні три відкриті — за датою розлоку, найсвіжіші першими.
const recent = computed(() =>
  ACHIEVEMENTS.filter((a) => isUnlocked(a.id))
    .sort((a, b) => (unlocked.value[b.id] ?? '').localeCompare(unlocked.value[a.id] ?? ''))
    .slice(0, 3),
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

    <div v-if="recent.length" class="ach-recent">
      <span
        v-for="a in recent"
        :key="a.id"
        class="ach-recent-icon"
        :title="`${a.title} — ${a.description}`"
      >
        {{ a.icon }}
      </span>
    </div>
    <p v-else class="muted compact">Ще нічого не відкрито — все попереду.</p>

    <button class="secondary-button small ach-open" type="button" @click="emit('open')">
      Усі досягнення →
    </button>
  </section>
</template>

<style scoped>
.achievements-panel {
  display: grid;
  gap: 12px;
}

.ach-recent {
  display: flex;
  gap: 10px;
}

.ach-recent-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--rose);
  font-size: 1.5rem;
}

.ach-open {
  justify-self: start;
}
</style>
