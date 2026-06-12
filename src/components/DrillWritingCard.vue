<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import { useDrillPrefs } from '../composables/useDrillPrefs'
import {
  passesTrace,
  tolerantTraceScore,
  type Point,
} from '../utils/strokeMatch'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import SakuraDecor from './SakuraDecor.vue'
import SkipControl from './SkipControl.vue'
import StrokeOrderHint from './StrokeOrderHint.vue'

const props = defineProps<{ deck: DrillDeck }>()
const {
  expectedKana,
  expectedRomaji,
  lastOutcome,
  index,
  sessionToken,
  answerWritten,
  retry,
  skip,
} = props.deck

const SIZE = 288 // canvas backing size in px
const GRID = 32 // coverage grid resolution
const GLYPH_FONT = `700 ${Math.floor(SIZE * 0.74)}px "Noto Sans JP", "Plus Jakarta Sans", sans-serif`
const GLYPH_BASELINE = SIZE / 2 + SIZE * 0.04

const canvasEl = ref<HTMLCanvasElement | null>(null)
const showGuide = ref(true)
const feedback = ref('')

// «З пам'яті»: чуєш кану (TTS) і пишеш на порожньому полотні — без сірого
// контуру і без ромадзі-промпта. Якщо синтез мовлення недоступний, промпт
// лишається текстовим, інакше режим був би непрохідним.
const { prefs } = useDrillPrefs()
const ttsSupported = isSpeechSynthesisSupported()
const blind = computed(() => prefs.value.writingBlind)
const speak = () => speakKana(expectedKana.value, { rate: 0.85 })

// --- Підказка порядку рисок (KanjiVG) ---------------------------------------
const showStrokeHint = ref(false)
const strokeHintAvailable = ref(false)
let strokeData: Record<string, string[]> | null = null

const refreshStrokeAvailability = async () => {
  if (!strokeData) {
    try {
      strokeData = (await import('../data/kanaStrokes')).KANA_STROKES
    } catch {
      strokeData = {}
    }
  }
  strokeHintAvailable.value = (strokeData[expectedKana.value] ?? []).length > 0
}

// Після помилки порядок рисок показуємо самі — це і є навчальний момент.
watch(lastOutcome, (outcome) => {
  if (outcome === 'wrong' && strokeHintAvailable.value) showStrokeHint.value = true
})

const strokes = ref<Point[][]>([])
const inkLength = ref(0)
let drawing = false

// --- Rasterisation helpers (offscreen → boolean grid) ----------------------
const downsample = (img: ImageData): boolean[] => {
  const cell = SIZE / GRID
  const out = new Array<boolean>(GRID * GRID).fill(false)
  for (let gy = 0; gy < GRID; gy += 1) {
    for (let gx = 0; gx < GRID; gx += 1) {
      let on = false
      const y1 = Math.floor((gy + 1) * cell)
      const x1 = Math.floor((gx + 1) * cell)
      for (let y = Math.floor(gy * cell); y < y1 && !on; y += 1) {
        for (let x = Math.floor(gx * cell); x < x1 && !on; x += 1) {
          if (img.data[(y * SIZE + x) * 4 + 3]! > 60) on = true
        }
      }
      out[gy * GRID + gx] = on
    }
  }
  return out
}

const rasterGlyph = (kana: string): boolean[] => {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const ctx = c.getContext('2d')
  if (!ctx) return new Array<boolean>(GRID * GRID).fill(false)
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = GLYPH_FONT
  ctx.fillText(kana, SIZE / 2, GLYPH_BASELINE)
  return downsample(ctx.getImageData(0, 0, SIZE, SIZE))
}

const rasterStrokes = (): boolean[] => {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  const ctx = c.getContext('2d')
  if (!ctx) return new Array<boolean>(GRID * GRID).fill(false)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 20
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes.value) {
    if (stroke.length === 0) continue
    ctx.beginPath()
    ctx.moveTo(stroke[0]!.x, stroke[0]!.y)
    for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i]!.x, stroke[i]!.y)
    if (stroke.length === 1) ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y + 0.1)
    ctx.stroke()
  }
  return downsample(ctx.getImageData(0, 0, SIZE, SIZE))
}

// --- Visible canvas --------------------------------------------------------
const redraw = () => {
  const cv = canvasEl.value
  const ctx = cv?.getContext('2d')
  if (!cv || !ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)

  if (showGuide.value && !blind.value && expectedKana.value) {
    ctx.save()
    ctx.fillStyle = 'rgba(120, 120, 140, 0.18)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = GLYPH_FONT
    ctx.fillText(expectedKana.value, SIZE / 2, GLYPH_BASELINE)
    ctx.restore()
  }

  const pen = getComputedStyle(cv).getPropertyValue('--primary').trim() || '#f45f8a'
  ctx.strokeStyle = pen
  ctx.lineWidth = 14
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const stroke of strokes.value) {
    if (stroke.length === 0) continue
    ctx.beginPath()
    ctx.moveTo(stroke[0]!.x, stroke[0]!.y)
    for (let i = 1; i < stroke.length; i += 1) ctx.lineTo(stroke[i]!.x, stroke[i]!.y)
    if (stroke.length === 1) ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y + 0.1)
    ctx.stroke()
  }
}

const toPoint = (e: PointerEvent): Point => {
  const cv = canvasEl.value!
  const rect = cv.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) * cv.width) / rect.width,
    y: ((e.clientY - rect.top) * cv.height) / rect.height,
  }
}

const onPointerDown = (e: PointerEvent) => {
  if (lastOutcome.value) return
  try {
    canvasEl.value?.setPointerCapture?.(e.pointerId)
  } catch {}
  drawing = true
  feedback.value = ''
  strokes.value.push([toPoint(e)])
  redraw()
}

const onPointerMove = (e: PointerEvent) => {
  if (!drawing) return
  const stroke = strokes.value[strokes.value.length - 1]!
  const prev = stroke[stroke.length - 1]!
  const point = toPoint(e)
  inkLength.value += Math.hypot(point.x - prev.x, point.y - prev.y)
  stroke.push(point)
  redraw()
}

const onPointerUp = () => {
  drawing = false
}

// --- Actions ---------------------------------------------------------------
const clearCanvas = () => {
  strokes.value = []
  inkLength.value = 0
  feedback.value = ''
  redraw()
}

const check = () => {
  if (lastOutcome.value || !expectedKana.value) return
  if (inkLength.value < SIZE * 0.6) {
    feedback.value = 'Намалюй кану повніше 🖌'
    return
  }
  const score = tolerantTraceScore(rasterGlyph(expectedKana.value), rasterStrokes(), GRID, GRID)
  // Без контуру попадання в растр гліфа об'єктивно гірше — пороги м'якші.
  const ok = blind.value
    ? passesTrace(score, { minCovered: 0.5, maxSpill: 0.5 })
    : passesTrace(score, { minCovered: 0.6, maxSpill: 0.4 })
  feedback.value = ''
  answerWritten(ok)
}

const tryAgain = () => {
  retry()
  clearCanvas()
}

watch([index, sessionToken], () => {
  strokes.value = []
  inkLength.value = 0
  feedback.value = ''
  showStrokeHint.value = false
  void refreshStrokeAvailability()
  redraw()
  if (blind.value && ttsSupported) speak()
})

watch(showGuide, redraw)
watch(blind, (on) => {
  redraw()
  if (on && ttsSupported) speak()
})

onMounted(() => {
  void refreshStrokeAvailability()
  redraw()
  if (blind.value && ttsSupported) speak()
})
</script>

<template>
  <section
    class="panel drill-card"
    :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
  >
    <SakuraDecor />
    <div class="drill-write-prompt">
      <template v-if="blind && ttsSupported">
        <span class="eyebrow">Послухай і напиши з пам'яті</span>
        <button
          class="drill-write-listen"
          type="button"
          title="Послухати ще раз"
          aria-label="Послухати кану ще раз"
          @click="speak"
        >
          🔊
        </button>
      </template>
      <template v-else>
        <span class="eyebrow">Напиши кану</span>
        <strong class="drill-write-romaji">{{ expectedRomaji || '—' }}</strong>
      </template>
    </div>

    <div class="drill-write-stage">
      <canvas
        ref="canvasEl"
        class="drill-write-canvas"
        :width="SIZE"
        :height="SIZE"
        @pointerdown.prevent="onPointerDown"
        @pointermove.prevent="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerleave="onPointerUp"
      />
      <StrokeOrderHint v-if="showStrokeHint" :kana="expectedKana" />
    </div>

    <p v-if="feedback" class="drill-write-feedback-note">{{ feedback }}</p>

    <div v-if="!lastOutcome" class="drill-write-controls">
      <button class="ghost-button small" type="button" @click="clearCanvas">Очистити</button>
      <button
        class="ghost-button small"
        type="button"
        :class="{ 'drill-blind-on': blind }"
        @click="prefs.writingBlind = !prefs.writingBlind"
      >
        {{ blind ? '🙈 З пам\'яті: увімк' : '🙈 З пам\'яті' }}
      </button>
      <button
        v-if="!blind"
        class="ghost-button small"
        type="button"
        @click="showGuide = !showGuide"
      >
        {{ showGuide ? 'Сховати зразок' : 'Показати зразок' }}
      </button>
      <button
        v-if="strokeHintAvailable && !blind"
        class="ghost-button small"
        type="button"
        @click="showStrokeHint = !showStrokeHint"
      >
        {{ showStrokeHint ? 'Сховати риски' : 'Порядок рисок' }}
      </button>
      <SkipControl @skip="skip" />
      <button class="primary-button" type="button" @click="check">Перевірити</button>
    </div>

    <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
      <strong>✓ Гарно написано!</strong>
      <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
    </div>

    <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
      <strong>✗ Ще не зовсім</strong>
      <span v-if="blind">Це була <b>{{ expectedKana }}</b> ({{ expectedRomaji }}) — глянь на риски й спробуй ще.</span>
      <span v-else>Обведи <b>{{ expectedKana }}</b> ({{ expectedRomaji }}) повніше — за зразком.</span>

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip()">Далі</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* iOS Safari: швидкі рухи пером/пальцем читаються як подвійний тап і
   виділяють canvas чи сусідній текст з меню «Скопіювати/Тлумачити».
   touch-action на полотні цього не покриває — виділення вимикається
   лише через user-select/-webkit-touch-callout, тому глушимо всю картку. */
.drill-card {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.drill-write-prompt {
  display: grid;
  justify-items: center;
  gap: 4px;
}

.drill-write-romaji {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.drill-write-listen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 20px;
  background: var(--rose);
  color: var(--primary);
  font-size: 1.6rem;
  cursor: pointer;
  box-shadow: var(--shadow);
  transition: transform 0.12s ease;
}

.drill-write-listen:hover {
  transform: translateY(-2px);
}

.drill-blind-on {
  border-color: var(--primary);
  color: var(--primary);
}

.drill-write-stage {
  position: relative;
  width: min(288px, 80vw);
  aspect-ratio: 1 / 1;
}

.drill-write-canvas {
  width: 100%;
  height: 100%;
  border: 2px dashed var(--divider);
  border-radius: 24px;
  background: var(--surface-raised);
  touch-action: none;
  cursor: crosshair;
}

.drill-write-feedback-note {
  margin: 0;
  color: var(--amber-strong);
  font-weight: 600;
}

.drill-write-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
</style>
