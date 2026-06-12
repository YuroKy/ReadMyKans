<script setup lang="ts">
// Спліт-кнопка пропуску: основна дія пропускає одну картку, стрілка поруч
// відкриває меню масового пропуску (3/5/10). Раніше це були чотири окремі
// кнопки «Пропустити ×3 ×5 ×10» — ряд захаращував контролі всіх форматів.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const emit = defineEmits<{ skip: [count: number] }>()

const BULK_OPTIONS = [
  { count: 3, noun: 'картки' },
  { count: 5, noun: 'карток' },
  { count: 10, noun: 'карток' },
]

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const pick = (count: number) => {
  open.value = false
  emit('skip', count)
}

const onDocPointerDown = (e: PointerEvent) => {
  if (!rootEl.value?.contains(e.target as Node)) open.value = false
}

const onDocKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  document.addEventListener('keydown', onDocKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  document.removeEventListener('keydown', onDocKeyDown)
})
</script>

<template>
  <div ref="rootEl" class="skip-control">
    <div class="skip-split">
      <button class="ghost-button small skip-main" type="button" @click="pick(1)">
        Пропустити
      </button>
      <button
        class="ghost-button small skip-toggle"
        type="button"
        aria-label="Пропустити кілька карток"
        :aria-expanded="open"
        @click="open = !open"
      >
        <span class="skip-toggle-arrow" :class="{ open }">▾</span>
      </button>
    </div>

    <div v-if="open" class="skip-menu" role="menu">
      <button
        v-for="{ count, noun } in BULK_OPTIONS"
        :key="count"
        class="skip-menu-item"
        type="button"
        role="menuitem"
        :aria-label="`Пропустити ${count} ${noun}`"
        @click="pick(count)"
      >
        <span class="skip-menu-count">{{ count }}</span> {{ noun }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.skip-control {
  position: relative;
  display: inline-flex;
}

.skip-split {
  display: inline-flex;
}

.skip-main {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.skip-toggle {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1.5px;
  padding: 0 10px;
}

.skip-toggle-arrow {
  display: inline-block;
  transition: transform 160ms ease;
}

.skip-toggle-arrow.open {
  transform: rotate(180deg);
}

.skip-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  display: grid;
  min-width: 132px;
  padding: 6px;
  border-radius: 16px;
  background: var(--surface-raised);
  box-shadow:
    var(--shadow),
    inset 0 0 0 1.5px var(--line);
}

.skip-menu-item {
  border: 0;
  border-radius: 11px;
  padding: 9px 12px;
  background: transparent;
  color: var(--ink);
  font-weight: 700;
  font-size: 0.88rem;
  text-align: left;
  cursor: pointer;
}

.skip-menu-item:hover {
  background: var(--rose);
  color: var(--primary);
}

.skip-menu-count {
  display: inline-block;
  min-width: 1.6em;
  color: var(--primary);
  font-weight: 800;
}
</style>
