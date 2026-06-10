<script setup lang="ts">
import { LIBRARY, type LibraryText } from '../data/library'

defineProps<{
  // Підсвічуємо картку, чий текст зараз у полі вводу.
  currentText: string
}>()

const emit = defineEmits<{
  select: [entry: LibraryText]
}>()
</script>

<template>
  <section class="panel library-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Бібліотека</p>
        <h2>Готові тексти</h2>
      </div>
    </div>

    <div class="library-grid">
      <button
        v-for="entry in LIBRARY"
        :key="entry.id"
        type="button"
        class="library-card"
        :class="{ active: entry.text === currentText }"
        @click="emit('select', entry)"
      >
        <span class="library-level">{{ entry.level }}</span>
        <strong class="library-title">{{ entry.title }}</strong>
        <span class="library-description">{{ entry.description }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.library-card {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--divider);
  background: var(--panel);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.library-card:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.library-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary) inset;
}

.library-level {
  justify-self: start;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sky);
  color: var(--sky-strong);
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
}

.library-title {
  color: var(--ink);
  font-size: 0.95rem;
  line-height: 1.35;
}

.library-description {
  color: var(--muted);
  font-size: 0.8rem;
  line-height: 1.4;
}
</style>
