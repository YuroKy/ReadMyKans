<script setup lang="ts">
import { computed } from 'vue'
import type { AppView, NavTarget } from '../types'

const props = defineProps<{
  view: AppView
  gamesLocked: boolean
  examTaken: boolean
}>()

const emit = defineEmits<{
  navigate: [target: NavTarget]
}>()

interface NavItem {
  id: NavTarget
  icon: string
  label: string
  locked?: boolean
  title?: string
}

const items = computed<NavItem[]>(() => [
  { id: 'home', icon: '⛩️', label: 'Головна' },
  { id: 'drill', icon: 'あ', label: 'Дрил' },
  { id: 'reading', icon: '📖', label: 'Читання' },
  {
    id: 'sprint',
    icon: '⏱️',
    label: 'Спідран',
    locked: props.gamesLocked,
    title: props.gamesLocked ? 'Замкнено: спершу сплати борг повторень' : undefined,
  },
  {
    id: 'memory',
    icon: '🎴',
    label: 'Пари',
    locked: props.gamesLocked,
    title: props.gamesLocked ? 'Замкнено: спершу сплати борг повторень' : undefined,
  },
  {
    id: 'exam',
    icon: '🎓',
    label: 'Екзамен',
    locked: props.examTaken,
    title: props.examTaken
      ? 'Уже складався цього тижня'
      : '50 кан, без підказок, одна спроба на тиждень',
  },
  { id: 'achievements', icon: '🏆', label: 'Досягнення' },
])

const isActive = (id: NavTarget) =>
  id === 'home' ? props.view === 'setup' : props.view === id
</script>

<template>
  <nav class="app-sidebar" aria-label="Навігація">
    <button
      v-for="item in items"
      :key="item.id"
      class="sidebar-item"
      :class="{ active: isActive(item.id), locked: item.locked }"
      type="button"
      :title="item.title"
      :aria-current="isActive(item.id) ? 'page' : undefined"
      @click="emit('navigate', item.id)"
    >
      <span class="sidebar-icon" aria-hidden="true">{{ item.locked ? '🔒' : item.icon }}</span>
      <span class="sidebar-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 156px;
  flex-shrink: 0;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.sidebar-item:hover {
  background: var(--sky);
  color: var(--sky-strong);
}

.sidebar-item.active {
  background: var(--mint);
  color: var(--mint-strong);
}

.sidebar-item.locked {
  opacity: 0.6;
}

.sidebar-icon {
  font-size: 1.1rem;
  line-height: 1;
  width: 1.4em;
  text-align: center;
}

/* На телефоні rail стає нижнім таб-баром. */
@media (max-width: 620px) {
  .app-sidebar {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 50;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    gap: 0;
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
  }

  .sidebar-item {
    flex-direction: column;
    gap: 2px;
    padding: 6px 4px;
    font-size: 0.62rem;
    flex: 1 1 0;
    align-items: center;
    text-align: center;
  }

  .sidebar-icon {
    font-size: 1.2rem;
  }
}
</style>
