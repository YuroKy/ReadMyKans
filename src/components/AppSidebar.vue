<script setup lang="ts">
import { computed } from 'vue'
import type { AppView, NavTarget } from '../types'

const props = defineProps<{
  view: AppView
  gamesLocked: boolean
  examTaken: boolean
  /** Бейдж на «Тренування»: кількість прострочених SRS-карток (борг). */
  drillBadge?: number
}>()

const emit = defineEmits<{
  navigate: [target: NavTarget]
}>()

interface NavItem {
  id: NavTarget
  icon: string
  label: string
  /** CSS-акцент чипа іконки (фон/колір) */
  accent: string
  locked?: boolean
  badge?: number
  title?: string
}

const items = computed<NavItem[]>(() => [
  { id: 'home', icon: '⛩️', label: 'Головна', accent: 'rose' },
  {
    id: 'drill',
    icon: 'あ',
    label: 'Тренування',
    accent: 'mint',
    badge: props.drillBadge && props.drillBadge > 0 ? props.drillBadge : undefined,
    title: props.drillBadge ? `Прострочено ${props.drillBadge} кан — час повторити` : undefined,
  },
  { id: 'reading', icon: '📖', label: 'Читання', accent: 'sky' },
  {
    id: 'sprint',
    icon: '⏱️',
    label: 'Спідран',
    accent: 'amber',
    locked: props.gamesLocked,
    title: props.gamesLocked ? 'Замкнено: спершу сплати борг повторень' : undefined,
  },
  {
    id: 'memory',
    icon: '🎴',
    label: 'Пари',
    accent: 'lavender',
    locked: props.gamesLocked,
    title: props.gamesLocked ? 'Замкнено: спершу сплати борг повторень' : undefined,
  },
  {
    id: 'exam',
    icon: '🎓',
    label: 'Екзамен',
    accent: 'sky',
    locked: props.examTaken,
    title: props.examTaken
      ? 'Уже складався цього тижня'
      : '50 кан, без підказок, одна спроба на тиждень',
  },
  { id: 'achievements', icon: '🏆', label: 'Досягнення', accent: 'amber' },
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
      :class="[`accent-${item.accent}`, { active: isActive(item.id), locked: item.locked }]"
      type="button"
      :title="item.title"
      :aria-current="isActive(item.id) ? 'page' : undefined"
      @click="emit('navigate', item.id)"
    >
      <span class="sidebar-icon" aria-hidden="true">
        {{ item.locked ? '🔒' : item.icon }}
        <span v-if="item.badge" class="sidebar-badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
      </span>
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
  gap: 6px;
  width: 168px;
  flex-shrink: 0;
  padding: 12px 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background:
    radial-gradient(220px 160px at 110% -10%, rgba(168, 140, 232, 0.14), transparent 70%),
    var(--panel);
  box-shadow: var(--shadow);
}

.sidebar-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.sidebar-item:hover {
  color: var(--ink);
  background: var(--surface-inset);
  transform: translateX(3px);
}

.sidebar-item:hover .sidebar-icon {
  transform: scale(1.12) rotate(-4deg);
}

.sidebar-item.active {
  background: var(--grad-primary);
  color: #ffffff;
  box-shadow: var(--shadow-pink);
  transform: none;
}

.sidebar-item.active .sidebar-icon {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
  transform: none;
}

.sidebar-item.locked {
  opacity: 0.55;
}

/* Іконка живе у мʼякому кольоровому чипі — кожен пункт зі своїм акцентом. */
.sidebar-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 11px;
  font-size: 1.08rem;
  line-height: 1;
  transition: transform 0.18s ease, background 0.18s ease;
}

.accent-rose .sidebar-icon { background: var(--rose); color: var(--rose-strong); }
.accent-mint .sidebar-icon { background: var(--mint); color: var(--mint-strong); }
.accent-sky .sidebar-icon { background: var(--sky); color: var(--sky-strong); }
.accent-amber .sidebar-icon { background: var(--amber); color: var(--amber-strong); }
.accent-lavender .sidebar-icon { background: rgba(168, 140, 232, 0.18); color: var(--lavender); }

.sidebar-badge {
  position: absolute;
  top: -6px;
  right: -7px;
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--rose-strong);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(235, 90, 110, 0.45);
}

/* На телефоні rail стає нижнім таб-баром — видимим на всіх екранах. */
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
    background: var(--panel);
    box-shadow: 0 -8px 28px rgba(37, 33, 63, 0.12);
  }

  .sidebar-item {
    flex-direction: column;
    gap: 3px;
    padding: 4px 2px 5px;
    font-size: 0.6rem;
    flex: 1 1 0;
    align-items: center;
    text-align: center;
    border-radius: 12px;
  }

  .sidebar-item:hover {
    transform: none;
  }

  .sidebar-item.active {
    background: transparent;
    color: var(--primary);
    box-shadow: none;
  }

  .sidebar-item.active .sidebar-icon {
    background: var(--grad-primary);
    color: #ffffff;
    box-shadow: var(--shadow-pink);
    transform: translateY(-3px) scale(1.06);
  }

  .sidebar-icon {
    width: 32px;
    height: 32px;
    font-size: 1.12rem;
  }
}

/* На десктопі сесійні view — фокус-режими: rail ховається. */
@media (min-width: 621px) {
  .app-sidebar.rail-only-mobile {
    display: none;
  }
}
</style>
