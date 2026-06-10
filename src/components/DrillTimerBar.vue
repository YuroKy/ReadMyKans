<script setup lang="ts">
// Тануча смужка часу на картку. Чистий CSS-відлік: анімація стартує заново,
// коли :key (generation) змінюється, тривалість задає сам deck.
defineProps<{ duration: number; generation: number }>()
</script>

<template>
  <div class="timer-track" role="timer" aria-label="Час на відповідь">
    <div
      :key="generation"
      class="timer-fill"
      :style="{ animationDuration: `${duration}ms` }"
    />
  </div>
</template>

<style scoped>
.timer-track {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: var(--surface-inset);
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--grad-primary);
  transform-origin: left;
  animation-name: timer-melt;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes timer-melt {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
    background: var(--rose-strong);
  }
}
</style>
