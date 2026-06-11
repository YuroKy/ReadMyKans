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

/** Секції — на десктопі між ними тонкі роздільники; на мобільному бар плоский. */
const sections = computed<NavItem[][]>(() => [
  [
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
  ],
  [
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
  ],
  [
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
  ],
])

const isActive = (id: NavTarget) =>
  id === 'home' ? props.view === 'setup' : props.view === id
</script>

<template>
  <nav class="app-sidebar" aria-label="Навігація">
    <template v-for="(section, si) in sections" :key="si">
      <span v-if="si > 0" class="sidebar-sep" aria-hidden="true" />
      <button
        v-for="item in section"
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
    </template>
  </nav>
</template>

<style scoped>
/* Панель: градієнтний хейрлайн-бордер (panel у padding-box, градієнт у border-box)
   + внутрішній світловий кант зверху — ефект «скла» без прозорості. */
.app-sidebar {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 168px;
  flex-shrink: 0;
  padding: 12px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background:
    radial-gradient(220px 160px at 110% -10%, rgba(168, 140, 232, 0.16), transparent 70%) padding-box,
    linear-gradient(var(--panel), var(--panel)) padding-box,
    linear-gradient(160deg, var(--line), rgba(168, 140, 232, 0.55) 45%, var(--line)) border-box;
  box-shadow:
    var(--shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

/* У темній темі білий світловий кант приглушуємо — інакше виглядає як подряпина. */
[data-theme='dark'] .app-sidebar {
  box-shadow:
    var(--shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

[data-theme='dark'] .sidebar-icon {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.sidebar-sep {
  height: 1px;
  margin: 5px 12px;
  background: linear-gradient(90deg, transparent, var(--line) 30%, var(--line) 70%, transparent);
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
    background 0.22s ease,
    color 0.22s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Боковий індикатор активного пункту — впритул до краю панелі. */
.sidebar-item::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  width: 4px;
  height: 0;
  border-radius: 999px;
  background: var(--grad-primary);
  transform: translateY(-50%);
  transition: height 0.25s ease;
}

.sidebar-item.active::before {
  height: 22px;
  box-shadow: 0 0 8px rgba(244, 95, 138, 0.55);
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

/* Шин: верхній відблиск на активній пігулці. */
.sidebar-item.active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 55%);
  pointer-events: none;
}

.sidebar-item.active .sidebar-icon {
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
  transform: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.sidebar-item.locked {
  opacity: 0.55;
}

.sidebar-item.locked .sidebar-icon {
  filter: grayscale(0.7);
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.22s ease, box-shadow 0.22s ease;
}

.accent-rose .sidebar-icon { background: var(--rose); color: var(--rose-strong); }
.accent-mint .sidebar-icon { background: var(--mint); color: var(--mint-strong); }
.accent-sky .sidebar-icon { background: var(--sky); color: var(--sky-strong); }
.accent-amber .sidebar-icon { background: var(--amber); color: var(--amber-strong); }
.accent-lavender .sidebar-icon { background: rgba(168, 140, 232, 0.18); color: var(--lavender); }

/* Мʼяке акцентне свічення чипа на ховері — «дорогий» дотик. */
.sidebar-item.accent-rose:hover .sidebar-icon { box-shadow: 0 4px 12px rgba(235, 90, 110, 0.35); }
.sidebar-item.accent-mint:hover .sidebar-icon { box-shadow: 0 4px 12px rgba(69, 184, 156, 0.35); }
.sidebar-item.accent-sky:hover .sidebar-icon { box-shadow: 0 4px 12px rgba(95, 143, 208, 0.35); }
.sidebar-item.accent-amber:hover .sidebar-icon { box-shadow: 0 4px 12px rgba(207, 138, 42, 0.35); }
.sidebar-item.accent-lavender:hover .sidebar-icon { box-shadow: 0 4px 12px rgba(168, 140, 232, 0.4); }

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
  animation: sidebar-badge-pulse 2.4s ease-out infinite;
}

@keyframes sidebar-badge-pulse {
  0% { box-shadow: 0 2px 6px rgba(235, 90, 110, 0.45), 0 0 0 0 rgba(235, 90, 110, 0.45); }
  55% { box-shadow: 0 2px 6px rgba(235, 90, 110, 0.45), 0 0 0 7px rgba(235, 90, 110, 0); }
  100% { box-shadow: 0 2px 6px rgba(235, 90, 110, 0.45), 0 0 0 7px rgba(235, 90, 110, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-item,
  .sidebar-icon {
    transition: none;
  }

  .sidebar-badge {
    animation: none;
  }
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
    border: 0;
    border-top: 1px solid var(--line);
    background: color-mix(in srgb, var(--panel) 82%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    box-shadow: 0 -8px 28px rgba(37, 33, 63, 0.12);
  }

  .sidebar-sep {
    display: none;
  }

  .sidebar-item::before,
  .sidebar-item.active::after {
    display: none;
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
