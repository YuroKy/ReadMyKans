<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

// Анімований порядок рисок поверх полотна письма. Дані KanjiVG вантажаться
// ледачим import-ом, щоб не роздувати основний бандл; якщо для гліфа даних
// немає — компонент просто нічого не рендерить.
const props = defineProps<{ kana: string }>()

interface StrokeStart {
  x: number
  y: number
}

const paths = ref<string[]>([])
const starts = ref<StrokeStart[]>([])
const replayKey = ref(0)

const startOf = (d: string): StrokeStart => {
  const match = /^[Mm]\s*([\d.+-]+)[\s,]+([\d.+-]+)/.exec(d.trim())
  return match ? { x: Number(match[1]), y: Number(match[2]) } : { x: 0, y: 0 }
}

const load = async () => {
  try {
    const { KANA_STROKES } = await import('../data/kanaStrokes')
    const strokes = KANA_STROKES[props.kana] ?? []
    paths.value = strokes
    starts.value = strokes.map(startOf)
    replayKey.value += 1
  } catch {
    paths.value = []
    starts.value = []
  }
}

watch(() => props.kana, load)
onMounted(load)

const replay = () => {
  replayKey.value += 1
}

defineExpose({ replay })
</script>

<template>
  <svg
    v-if="paths.length"
    :key="replayKey"
    class="stroke-hint"
    viewBox="0 0 109 109"
    aria-label="Порядок рисок"
    role="img"
  >
    <path
      v-for="(d, i) in paths"
      :key="`p${i}`"
      :d="d"
      pathLength="1"
      class="stroke-hint-path"
      :style="{ animationDelay: `${i * 0.6}s` }"
    />
    <text
      v-for="(point, i) in starts"
      :key="`n${i}`"
      :x="Math.max(point.x - 7, 2)"
      :y="Math.max(point.y - 3, 8)"
      class="stroke-hint-num"
      :style="{ animationDelay: `${i * 0.6}s` }"
    >
      {{ i + 1 }}
    </text>
  </svg>
</template>

<style scoped>
.stroke-hint {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stroke-hint-path {
  fill: none;
  stroke: var(--sky-strong);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: stroke-draw 0.55s ease forwards;
}

.stroke-hint-num {
  font-size: 10px;
  font-weight: 700;
  fill: var(--rose-strong);
  opacity: 0;
  animation: stroke-num 0.2s ease forwards;
}

@keyframes stroke-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes stroke-num {
  to {
    opacity: 1;
  }
}
</style>
