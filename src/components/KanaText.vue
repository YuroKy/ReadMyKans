<script setup lang="ts">
import { computed } from 'vue'
import { isSmallKana } from '../utils/kana'

// Рендерить кану посимвольно, зменшуючи малі кани (ょ, っ; ー не рахується)
// до половини розміру — щоб ひょ візуально читалось як діграф.
const props = defineProps<{ text: string }>()

const chars = computed(() => [...props.text].map((ch) => ({ ch, small: isSmallKana(ch) })))
</script>

<template>
  <span class="kana-text"><span
    v-for="(c, i) in chars"
    :key="i"
    :class="{ 'kana-small': c.small }"
  >{{ c.ch }}</span></span>
</template>

<style scoped>
.kana-small {
  font-size: 0.5em;
}
</style>
