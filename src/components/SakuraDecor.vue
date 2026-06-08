<script setup lang="ts">
withDefaults(
  defineProps<{
    density?: 'soft' | 'rich'
  }>(),
  { density: 'soft' },
)
</script>

<template>
  <div class="sakura-decor" :class="`is-${density}`" aria-hidden="true">
    <svg
      v-for="n in density === 'rich' ? 5 : 3"
      :key="n"
      class="sakura-blossom"
      :class="`b${n}`"
      viewBox="0 0 100 100"
    >
      <g class="petals">
        <ellipse cx="50" cy="27" rx="12" ry="20" transform="rotate(0 50 50)" />
        <ellipse cx="50" cy="27" rx="12" ry="20" transform="rotate(72 50 50)" />
        <ellipse cx="50" cy="27" rx="12" ry="20" transform="rotate(144 50 50)" />
        <ellipse cx="50" cy="27" rx="12" ry="20" transform="rotate(216 50 50)" />
        <ellipse cx="50" cy="27" rx="12" ry="20" transform="rotate(288 50 50)" />
      </g>
      <circle class="pistil" cx="50" cy="50" r="7" />
    </svg>

    <span class="sakura-petal p1" />
    <span class="sakura-petal p2" />
    <span class="sakura-petal p3" />
    <span v-if="density === 'rich'" class="sakura-petal p4" />
  </div>
</template>
