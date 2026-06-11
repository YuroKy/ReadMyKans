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
    <!-- Брендова шапка (лише десктоп) -->
    <div class="sidebar-brand">
      <span class="brand-medallion" aria-hidden="true">か</span>
      <span class="brand-name">Kana Reader</span>
      <span class="brand-tag">Практика голосом</span>
    </div>

    <span class="sidebar-heading" aria-hidden="true">Навігація</span>

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

    <!-- Нічна сценка: місяць, торії, кіт, сакура (темна тема, лише десктоп) -->
    <svg class="sidebar-art sidebar-art--night" viewBox="0 0 168 150" aria-hidden="true">
      <defs>
        <linearGradient id="sb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#473364" />
          <stop offset="1" stop-color="#1a1330" />
        </linearGradient>
        <radialGradient id="sb-moonglow">
          <stop offset="0" stop-color="#ffe9f4" stop-opacity="0.9" />
          <stop offset="0.55" stop-color="#f3c9e6" stop-opacity="0.28" />
          <stop offset="1" stop-color="#f3c9e6" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="168" height="150" fill="url(#sb-sky)" />
      <circle cx="22" cy="22" r="1.2" fill="#fff" opacity="0.55" />
      <circle cx="48" cy="12" r="0.9" fill="#fff" opacity="0.4" />
      <circle cx="104" cy="18" r="1.1" fill="#fff" opacity="0.5" />
      <circle cx="146" cy="34" r="0.9" fill="#fff" opacity="0.45" />
      <circle cx="128" cy="8" r="0.8" fill="#fff" opacity="0.35" />
      <circle cx="62" cy="66" r="36" fill="url(#sb-moonglow)" />
      <circle cx="62" cy="66" r="17" fill="#f9ecff" />
      <!-- гілка сакури у кутку -->
      <path d="M168 4 q-24 6 -34 22" stroke="#3a2547" stroke-width="5" fill="none" stroke-linecap="round" />
      <circle cx="150" cy="10" r="6" fill="#f7a9c8" />
      <circle cx="140" cy="18" r="5" fill="#fbd0e2" />
      <circle cx="158" cy="18" r="4.5" fill="#fbd0e2" />
      <circle cx="133" cy="27" r="4" fill="#f7a9c8" />
      <!-- земля -->
      <path d="M0 122 q42 -12 84 -4 q44 8 84 -2 L168 150 L0 150 Z" fill="#241a3a" />
      <!-- торії -->
      <g fill="#140e22">
        <path d="M24 56 q40 -10 82 0 l-2 9 q-39 -9 -78 0 Z" />
        <rect x="33" y="72" width="62" height="5" rx="2" />
        <rect x="40" y="61" width="6" height="58" rx="2" />
        <rect x="84" y="61" width="6" height="58" rx="2" />
      </g>
      <!-- кіт дивиться на місяць -->
      <g fill="#120d1e">
        <path d="M128 124 c0 -12 6 -19 12 -19 c6 0 12 7 12 19 Z" />
        <circle cx="140" cy="101" r="8" />
        <path d="M134 97 l-3 -9 7 4 Z" />
        <path d="M146 97 l3 -9 -7 4 Z" />
      </g>
      <path d="M128 122 q-10 -2 -9 -13" stroke="#120d1e" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <!-- пелюстки на землі та в повітрі -->
      <ellipse cx="34" cy="128" rx="3" ry="1.6" fill="#f49ec4" opacity="0.75" transform="rotate(-14 34 128)" />
      <ellipse cx="70" cy="134" rx="2.6" ry="1.4" fill="#f7b8d2" opacity="0.7" transform="rotate(10 70 134)" />
      <ellipse cx="110" cy="130" rx="3" ry="1.5" fill="#f49ec4" opacity="0.6" transform="rotate(-30 110 130)" />
      <ellipse cx="96" cy="96" rx="2.6" ry="1.4" fill="#f7b8d2" opacity="0.7" transform="rotate(24 96 96)" />
      <ellipse cx="22" cy="84" rx="2.4" ry="1.3" fill="#f49ec4" opacity="0.55" transform="rotate(-40 22 84)" />
    </svg>

    <!-- Денна сценка: ранкове небо, сонце, червоні торії (світла тема) -->
    <svg class="sidebar-art sidebar-art--day" viewBox="0 0 168 150" aria-hidden="true">
      <defs>
        <linearGradient id="sb-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffeef4" />
          <stop offset="1" stop-color="#ffd9e5" />
        </linearGradient>
        <radialGradient id="sb-sunglow">
          <stop offset="0" stop-color="#fff3d6" stop-opacity="0.95" />
          <stop offset="0.55" stop-color="#ffe3c2" stop-opacity="0.35" />
          <stop offset="1" stop-color="#ffe3c2" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="168" height="150" fill="url(#sb-sky-day)" />
      <circle cx="62" cy="58" r="34" fill="url(#sb-sunglow)" />
      <circle cx="62" cy="58" r="14" fill="#ffe9b8" />
      <!-- хмаринки -->
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="118" cy="40" rx="16" ry="5.5" />
        <ellipse cx="130" cy="36" rx="11" ry="4.5" />
        <ellipse cx="30" cy="24" rx="13" ry="4.5" />
      </g>
      <!-- гілка сакури у кутку -->
      <path d="M168 4 q-24 6 -34 22" stroke="#9a5d72" stroke-width="5" fill="none" stroke-linecap="round" />
      <circle cx="150" cy="10" r="6" fill="#f78bb4" />
      <circle cx="140" cy="18" r="5" fill="#fbc2d8" />
      <circle cx="158" cy="18" r="4.5" fill="#fbc2d8" />
      <circle cx="133" cy="27" r="4" fill="#f78bb4" />
      <!-- земля -->
      <path d="M0 122 q42 -12 84 -4 q44 8 84 -2 L168 150 L0 150 Z" fill="#f6bfd2" />
      <!-- торії — класична кіновар -->
      <g fill="#d9536a">
        <path d="M24 56 q40 -10 82 0 l-2 9 q-39 -9 -78 0 Z" />
        <rect x="33" y="72" width="62" height="5" rx="2" />
        <rect x="40" y="61" width="6" height="58" rx="2" />
        <rect x="84" y="61" width="6" height="58" rx="2" />
      </g>
      <!-- кіт дивиться на сонце -->
      <g fill="#4a3756">
        <path d="M128 124 c0 -12 6 -19 12 -19 c6 0 12 7 12 19 Z" />
        <circle cx="140" cy="101" r="8" />
        <path d="M134 97 l-3 -9 7 4 Z" />
        <path d="M146 97 l3 -9 -7 4 Z" />
      </g>
      <path d="M128 122 q-10 -2 -9 -13" stroke="#4a3756" stroke-width="4.5" fill="none" stroke-linecap="round" />
      <!-- пелюстки на землі та в повітрі -->
      <ellipse cx="34" cy="128" rx="3" ry="1.6" fill="#ef7fae" opacity="0.8" transform="rotate(-14 34 128)" />
      <ellipse cx="70" cy="134" rx="2.6" ry="1.4" fill="#f49cc0" opacity="0.75" transform="rotate(10 70 134)" />
      <ellipse cx="110" cy="130" rx="3" ry="1.5" fill="#ef7fae" opacity="0.65" transform="rotate(-30 110 130)" />
      <ellipse cx="96" cy="96" rx="2.6" ry="1.4" fill="#f49cc0" opacity="0.75" transform="rotate(24 96 96)" />
      <ellipse cx="22" cy="84" rx="2.4" ry="1.3" fill="#ef7fae" opacity="0.6" transform="rotate(-40 22 84)" />
    </svg>

    <!-- Летючі пелюстки поверх панелі (декор) -->
    <span class="sidebar-petal petal-1" aria-hidden="true" />
    <span class="sidebar-petal petal-2" aria-hidden="true" />
    <span class="sidebar-petal petal-3" aria-hidden="true" />
  </nav>
</template>

<style scoped>
/* Панель: неоновий градієнтний бордер (panel у padding-box, градієнт у border-box)
   + мʼяке рожеве свічення назовні і світловий кант зверху. */
.app-sidebar {
  /* Липкість дає батьківська .app-rail; relative — якір для пелюсток/вотермарки. */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  flex-shrink: 0;
  padding: 14px 12px 12px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius);
  background:
    radial-gradient(240px 200px at 110% -10%, rgba(168, 140, 232, 0.18), transparent 70%) padding-box,
    linear-gradient(var(--panel), var(--panel)) padding-box,
    linear-gradient(165deg, rgba(255, 123, 163, 0.75), rgba(168, 140, 232, 0.65) 45%, rgba(255, 123, 163, 0.45)) border-box;
  box-shadow:
    var(--shadow),
    0 0 26px rgba(244, 95, 138, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

/* Велика кана-вотермарка за пунктами навігації. */
.app-sidebar::after {
  content: 'あ';
  position: absolute;
  right: -22px;
  top: 46%;
  z-index: 0;
  font-size: 120px;
  font-weight: 800;
  line-height: 1;
  color: var(--lavender);
  opacity: 0.06;
  transform: rotate(-12deg);
  pointer-events: none;
}

/* У темній темі білі канти приглушуємо, а неон — підсилюємо. */
[data-theme='dark'] .app-sidebar {
  box-shadow:
    var(--shadow),
    0 0 34px rgba(244, 95, 138, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

[data-theme='dark'] .sidebar-icon {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* ── Брендова шапка ── */
.sidebar-brand {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 8px 4px 12px;
  text-align: center;
}

.brand-medallion {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: 6px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
  color: #ffffff;
  background: radial-gradient(circle at 30% 25%, #ff9ec0, #b06ad6 75%);
  box-shadow:
    0 0 0 3px rgba(255, 123, 163, 0.22),
    0 6px 22px rgba(244, 95, 138, 0.45);
}

.brand-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--ink);
}

.brand-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
}

.sidebar-heading {
  position: relative;
  z-index: 1;
  margin: 2px 10px 4px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--primary);
}

.sidebar-sep {
  height: 1px;
  margin: 5px 12px;
  background: linear-gradient(90deg, transparent, var(--line) 30%, var(--line) 70%, transparent);
}

/* ── Пункти навігації: бордеровані пігулки, як «кнопки-самоцвіти» ── */
.sidebar-item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--line) 65%, transparent);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-inset) 45%, transparent);
  color: var(--muted);
  font: inherit;
  font-weight: 700;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.22s ease,
    border-color 0.22s ease,
    color 0.22s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Боковий індикатор активного пункту — впритул до краю панелі. */
.sidebar-item::before {
  content: '';
  position: absolute;
  left: -12px;
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
  border-color: color-mix(in srgb, var(--primary) 35%, transparent);
  background: var(--surface-inset);
  transform: translateX(3px);
}

.sidebar-item:hover .sidebar-icon {
  transform: scale(1.12) rotate(-4deg);
}

.sidebar-item.active {
  border-color: transparent;
  background: var(--grad-primary);
  color: #ffffff;
  box-shadow:
    var(--shadow-pink),
    0 0 18px rgba(244, 95, 138, 0.4);
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

/* ── Сценка внизу: день у світлій темі, ніч у темній ── */
.sidebar-art {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: auto;
  margin-top: 10px;
  border-radius: 18px;
}

.sidebar-art--day {
  box-shadow:
    inset 0 0 0 1px rgba(217, 83, 106, 0.14),
    0 8px 22px rgba(244, 95, 138, 0.18);
}

.sidebar-art--night {
  display: none;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 22px rgba(26, 19, 48, 0.35);
}

/* Медіа-гард, щоб театральна зміна теми не показала сценку в мобільному барі. */
@media (min-width: 621px) {
  [data-theme='dark'] .sidebar-art--day {
    display: none;
  }

  [data-theme='dark'] .sidebar-art--night {
    display: block;
  }
}

/* ── Летючі пелюстки ── */
.sidebar-petal {
  position: absolute;
  top: -14px;
  z-index: 2;
  width: 10px;
  height: 8px;
  border-radius: 70% 12% 70% 12%;
  background: linear-gradient(135deg, #ffc7da, #f48ab2);
  opacity: 0;
  pointer-events: none;
  animation: sidebar-petal-fall 12s linear infinite;
}

.petal-1 { left: 22%; }
.petal-2 { left: 56%; animation-delay: 4s; animation-duration: 14s; }
.petal-3 { left: 82%; animation-delay: 8s; animation-duration: 10s; }

@keyframes sidebar-petal-fall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  6% { opacity: 0.85; }
  50% { transform: translate(-14px, 300px) rotate(160deg); }
  88% { opacity: 0.85; }
  100% { transform: translate(8px, 620px) rotate(320deg); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-item,
  .sidebar-icon {
    transition: none;
  }

  .sidebar-badge {
    animation: none;
  }

  .sidebar-petal {
    display: none;
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

  .app-sidebar::after {
    display: none;
  }

  .sidebar-brand,
  .sidebar-heading,
  .sidebar-sep,
  .sidebar-art,
  .sidebar-petal {
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
    border: 0;
    border-radius: 12px;
    background: transparent;
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

</style>
