<script setup lang="ts">
import { computed } from 'vue'

// Медальйон досягнення: спільна рамка (кільце з градієнтом у палітрі
// застосунку) + гліф за id ачивки. Для id без гліфа — emoji-фолбек, тож
// каталог можна розширювати, не малюючи одразу іконку.

const props = defineProps<{
  id: string
  icon?: string
  unlocked?: boolean
  size?: number
  // «Зала ганьби»: попелястий медальйон без святкового градієнта.
  shame?: boolean
}>()

// Внутрішня розмітка SVG у системі координат 48×48 (центр 24,24).
// Заливки — через CSS-класи medal-glyph / medal-cut, щоб locked-стан і теми
// працювали без дублювання шляхів.
const GLYPHS: Record<string, string> = {
  // 💯 → «100»
  'cards-100': '<text x="24" y="30" text-anchor="middle" class="medal-glyph medal-text" font-size="14">100</text>',
  // 🏯 → пагода
  'cards-500':
    '<path class="medal-glyph" d="M14 34h20v4H14zM16 28h16l2 4H14zM17 22h14l2 4H15zM19 16h10l2 4H17zM22 10h4l2 4h-8z"/>',
  // 🔥 стрік-тиждень → календар із галочкою
  'streak-7':
    '<path class="medal-glyph" d="M14 13h20a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2zm-2 8h24v-4H12z"/><path class="medal-cut" d="M21.5 31.6 17 27l2.2-2.2 2.3 2.3 5.3-5.3L29 24z"/>',
  // 🌕 → півмісяць
  'streak-30':
    '<path class="medal-glyph" d="M28 10a14 14 0 1 0 0 28 11 11 0 0 1-9-11 11 11 0 0 1 9-17z"/>',
  'hiragana-master':
    '<text x="24" y="32" text-anchor="middle" class="medal-glyph medal-text" font-size="22">あ</text>',
  'katakana-master':
    '<text x="24" y="32" text-anchor="middle" class="medal-glyph medal-text" font-size="22">ア</text>',
  // 🎯 → мішень
  'perfect-session':
    '<circle cx="24" cy="24" r="13" fill="none" class="medal-stroke" stroke-width="3"/><circle cx="24" cy="24" r="7" fill="none" class="medal-stroke" stroke-width="3"/><circle cx="24" cy="24" r="2.5" class="medal-glyph"/>',
  // ⚡ → блискавка
  'sprint-30': '<polygon class="medal-glyph" points="27 8 14 27 22 27 21 40 34 21 26 21"/>',
  // 🔥 комбо → полум'я
  'combo-20':
    '<path class="medal-glyph" d="M25 8s2 4-1 8c-2 3-5 5-5 9a6 6 0 0 0 12 0c0-2-1-3-1-3s4 1 4 6a10 10 0 0 1-20 0c0-6 5-9 7-13 2-3 4-7 4-7z"/>',
  // 💀 → череп
  'suddendeath-15':
    '<path class="medal-glyph" d="M24 9c-8 0-13 5.5-13 12.5 0 4.5 2.5 8 6 9.8V36a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.7c3.5-1.8 6-5.3 6-9.8C37 14.5 32 9 24 9z"/><circle class="medal-cut" cx="19" cy="22" r="3"/><circle class="medal-cut" cx="29" cy="22" r="3"/><rect class="medal-cut" x="22.7" y="28" width="2.6" height="6"/>',
  // 🔁 «Знову ти» → стрілки по колу
  'shame-again-you':
    '<path class="medal-glyph" d="M24 12a12 12 0 0 1 11 7h-4.4A8 8 0 0 0 16 24h-4a12 12 0 0 1 12-12zm-7 17.4A8 8 0 0 0 32 24h4a12 12 0 0 1-23 5h4zM31 13l6 6h-6zM17 35l-6-6h6z"/>',
  // 🐌 «Шість секунд» → равлик
  'shame-six-seconds':
    '<circle cx="21" cy="24" r="9" fill="none" class="medal-stroke" stroke-width="3"/><circle cx="21" cy="24" r="3.5" class="medal-glyph"/><path class="medal-glyph" d="M12 33h26v3H12zM33 33V21h3v12zM36 22c0-3-2-5-2-5l2-2s3 3 3 7z"/>',
  // 🎴 → чотири формати (плитки 2×2)
  'all-formats':
    '<rect class="medal-glyph" x="12" y="12" width="11" height="11" rx="3"/><rect class="medal-glyph" x="25" y="12" width="11" height="11" rx="3" opacity="0.75"/><rect class="medal-glyph" x="12" y="25" width="11" height="11" rx="3" opacity="0.75"/><rect class="medal-glyph" x="25" y="25" width="11" height="11" rx="3"/>',
}

const glyph = computed(() => GLYPHS[props.id])
const gradientId = computed(() => `ach-grad-${props.id}`)
const px = computed(() => props.size ?? 44)
</script>

<template>
  <svg
    :width="px"
    :height="px"
    viewBox="0 0 48 48"
    class="ach-medal"
    :class="{ locked: !unlocked, shame }"
    role="img"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" class="medal-stop-a" />
        <stop offset="1" class="medal-stop-b" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" class="medal-bg" />
    <circle
      cx="24"
      cy="24"
      r="22"
      fill="none"
      class="medal-ring"
      :stroke="`url(#${gradientId})`"
      stroke-width="3"
    />
    <!-- eslint-disable-next-line vue/no-v-html — статичний реєстр гліфів, не користувацький ввід -->
    <g v-if="glyph" v-html="glyph" />
    <text v-else x="24" y="31" text-anchor="middle" class="medal-emoji" font-size="20">
      {{ icon }}
    </text>
  </svg>
</template>

<style>
/* Без scoped: інлайн-гліфи з v-html не отримують scope-атрибутів. Класи
   достатньо специфічні, щоб не текти за межі медальйонів. */
.ach-medal {
  --medal-surface: var(--rose);
  display: block;
  flex-shrink: 0;
}

.ach-medal .medal-bg {
  fill: var(--medal-surface);
}

.ach-medal .medal-stop-a {
  stop-color: #ff7ba3;
}

.ach-medal .medal-stop-b {
  stop-color: var(--primary);
}

.ach-medal .medal-glyph {
  fill: var(--primary);
}

.ach-medal .medal-stroke {
  stroke: var(--primary);
}

.ach-medal .medal-cut {
  fill: var(--medal-surface);
}

.ach-medal .medal-text {
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-weight: 800;
}

/* «Зала ганьби»: попіл замість свята навіть у відкритих. */
.ach-medal.shame {
  --medal-surface: var(--surface-inset);
}

.ach-medal.shame .medal-ring {
  stroke: var(--muted);
  opacity: 0.6;
}

.ach-medal.shame .medal-glyph {
  fill: var(--muted);
}

.ach-medal.shame .medal-stroke {
  stroke: var(--muted);
}

/* Locked: сірий силует без градієнта. */
.ach-medal.locked {
  --medal-surface: var(--surface-inset);
}

.ach-medal.locked .medal-ring {
  stroke: var(--divider);
}

.ach-medal.locked .medal-glyph {
  fill: var(--muted);
  opacity: 0.55;
}

.ach-medal.locked .medal-stroke {
  stroke: var(--muted);
  opacity: 0.55;
}

.ach-medal.locked .medal-emoji {
  filter: grayscale(1);
  opacity: 0.55;
}
</style>
