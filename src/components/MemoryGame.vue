<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { buildKanaSets, findKanaSet } from '../utils/kanaSets'
import { buildDeck, isMatch, type MemoryCard, type MemoryMode } from '../utils/memoryGame'
import { track } from '../utils/analytics'
import { useBestScores } from '../composables/useBestScores'
import { useDailyProgress } from '../composables/useDailyProgress'
import { useToasts } from '../composables/useToasts'
import { useSfx } from '../composables/useSfx'
import SakuraDecor from './SakuraDecor.vue'

const emit = defineEmits<{ exit: [] }>()

const sets = buildKanaSets()
const selectedSetId = ref('hiragana')
const mode = ref<MemoryMode>('kana')
const pairs = ref(6)

const { best, has, recordLow } = useBestScores()
const daily = useDailyProgress()
const toasts = useToasts()
const { play: playSfx } = useSfx()

const status = ref<'setup' | 'playing' | 'won'>('setup')
const deck = ref<MemoryCard[]>([])
const flipped = ref<number[]>([])
const matched = ref<Set<string>>(new Set())
const moves = ref(0)
const elapsed = ref(0)
const isNewRecord = ref(false)

let timer: ReturnType<typeof setInterval> | null = null
let flipTimeout: ReturnType<typeof setTimeout> | null = null

const bestKey = computed(() => `memory:${mode.value}:${pairs.value}`)
const previousBest = computed(() => (has(bestKey.value) ? best(bestKey.value) : null))

const stopTimer = () => {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

const start = () => {
  const set = findKanaSet(selectedSetId.value)
  const pool = set ? [...set.kana] : []
  deck.value = buildDeck(pool, pairs.value, mode.value)
  flipped.value = []
  matched.value = new Set()
  moves.value = 0
  elapsed.value = 0
  isNewRecord.value = false
  status.value = 'playing'
  stopTimer()
  timer = setInterval(() => (elapsed.value += 1), 1000)
  track('memory-start', { set: selectedSetId.value, mode: mode.value, pairs: pairs.value })
}

const isFlipped = (i: number) => flipped.value.includes(i)
const isDone = (i: number) => matched.value.has(deck.value[i]!.id)

const flip = (i: number) => {
  if (status.value !== 'playing') return
  if (flipped.value.length === 2 || isFlipped(i) || isDone(i)) return
  flipped.value = [...flipped.value, i]
  if (flipped.value.length !== 2) return

  moves.value += 1
  const [x, y] = flipped.value as [number, number]
  if (isMatch(deck.value[x]!, deck.value[y]!)) {
    const next = new Set(matched.value)
    next.add(deck.value[x]!.id)
    next.add(deck.value[y]!.id)
    matched.value = next
    flipped.value = []
    playSfx('correct')
    if (daily.add(1)) {
      toasts.push({ icon: '🎯', title: 'Денну ціль виконано!', text: 'Так тримати — стрік у безпеці.' })
    }
    if (matched.value.size === deck.value.length) win()
  } else {
    flipTimeout = setTimeout(() => (flipped.value = []), 800)
  }
}

const win = () => {
  stopTimer()
  status.value = 'won'
  isNewRecord.value = recordLow(bestKey.value, moves.value)
  playSfx(isNewRecord.value ? 'fanfare' : 'finish')
  track('memory-win', {
    mode: mode.value,
    pairs: pairs.value,
    moves: moves.value,
    seconds: elapsed.value,
    newRecord: isNewRecord.value,
  })
}

const backToSetup = () => {
  stopTimer()
  status.value = 'setup'
}

const formattedTime = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

onBeforeUnmount(() => {
  stopTimer()
  if (flipTimeout) clearTimeout(flipTimeout)
})
</script>

<template>
  <main class="memory-layout">
    <section class="session-hero">
      <SakuraDecor />
      <div>
        <p class="eyebrow">Міні-гра</p>
        <h1>🎴 Пари</h1>
      </div>
      <button class="ghost-button small" type="button" @click="emit('exit')">Вийти</button>
    </section>

    <section v-if="status === 'setup'" class="panel memory-setup">
      <label class="drill-source">
        <span class="eyebrow">Набір кани</span>
        <select v-model="selectedSetId" class="mic-select">
          <option v-for="set in sets" :key="set.id" :value="set.id">{{ set.label }}</option>
        </select>
      </label>

      <div class="memory-options">
        <div class="memory-toggle">
          <span class="eyebrow">Тип пар</span>
          <div class="seg">
            <button type="button" :class="{ active: mode === 'kana' }" @click="mode = 'kana'">
              хіра ↔ ката
            </button>
            <button type="button" :class="{ active: mode === 'romaji' }" @click="mode = 'romaji'">
              кана ↔ ромадзі
            </button>
          </div>
        </div>

        <label class="drill-source">
          <span class="eyebrow">Пар</span>
          <select v-model.number="pairs" class="mic-select">
            <option :value="6">6</option>
            <option :value="8">8</option>
            <option :value="10">10</option>
          </select>
        </label>
      </div>

      <p class="muted compact">
        Знайди всі пари за якомога менше ходів.
        <template v-if="previousBest !== null"> Рекорд: <b>{{ previousBest }}</b> ходів.</template>
      </p>
      <button class="primary-button" type="button" @click="start">Старт</button>
    </section>

    <template v-else>
      <section class="panel memory-hud">
        <span>Ходи: <strong>{{ moves }}</strong></span>
        <span>Час: <strong>{{ formattedTime }}</strong></span>
        <span>Пари: <strong>{{ matched.size / 2 }} / {{ pairs }}</strong></span>
      </section>

      <section v-if="status === 'won'" class="panel memory-won">
        <SakuraDecor density="rich" />
        <h1>{{ isNewRecord ? '🏆 Новий рекорд!' : '🌸 Готово!' }}</h1>
        <p>Зібрано за <b>{{ moves }}</b> ходів і <b>{{ formattedTime }}</b>.</p>
        <div class="session-actions">
          <button class="primary-button" type="button" @click="start">Ще раз</button>
          <button class="secondary-button" type="button" @click="backToSetup">Налаштування</button>
          <button class="ghost-button" type="button" @click="emit('exit')">Вийти</button>
        </div>
      </section>

      <section v-else class="memory-grid">
        <button
          v-for="(card, i) in deck"
          :key="card.id"
          type="button"
          class="memory-card"
          :class="{ flipped: isFlipped(i), done: isDone(i), romaji: card.romaji }"
          :disabled="isDone(i)"
          @click="flip(i)"
        >
          <span v-if="isFlipped(i) || isDone(i)" class="memory-face">{{ card.face }}</span>
          <span v-else class="memory-back" aria-hidden="true">か</span>
        </button>
      </section>
    </template>
  </main>
</template>

<style scoped>
.memory-layout {
  display: grid;
  gap: 18px;
}

.memory-setup {
  display: grid;
  gap: 14px;
  justify-items: start;
  padding: 24px;
}

.memory-options {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: end;
}

.memory-toggle {
  display: grid;
  gap: 6px;
}

.seg {
  display: inline-flex;
  border-radius: 999px;
  background: var(--surface-inset);
  padding: 3px;
  gap: 2px;
}

.seg button {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
}

.seg button.active {
  background: var(--surface-raised);
  color: var(--primary);
  box-shadow: var(--shadow);
}

.memory-hud {
  display: flex;
  gap: 24px;
  justify-content: center;
  font-size: 0.95rem;
  color: var(--muted);
  padding: 14px 24px;
}

.memory-hud strong {
  color: var(--ink);
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 12px;
}

.memory-card {
  aspect-ratio: 3 / 4;
  border: 0;
  border-radius: 16px;
  background: var(--grad-secondary, var(--rose));
  cursor: pointer;
  display: grid;
  place-items: center;
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  box-shadow: var(--shadow);
  transition: transform 0.12s ease, opacity 0.2s ease;
}

.memory-card:hover:not(:disabled) {
  transform: translateY(-2px);
}

.memory-face {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink);
}

.memory-card.romaji .memory-face {
  font-family: "Plus Jakarta Sans", sans-serif;
  letter-spacing: 0.03em;
}

.memory-back {
  font-size: 1.6rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.memory-card.flipped {
  background: var(--surface-raised);
  border: 2px solid var(--primary);
}

.memory-card.done {
  background: var(--mint);
  opacity: 0.55;
  cursor: default;
}

.memory-won {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
  padding: 32px 24px;
}

/* Трек перемикача й відкрита картка вище жорстко світлі; в темній темі
   --ink/--muted стають світлими, тож їм потрібна темна поверхня. */
[data-theme='dark'] .seg {
  background: #2c2640;
}

[data-theme='dark'] .seg button.active {
  background: #403858;
}

[data-theme='dark'] .memory-card.flipped {
  background: #2c2640;
}
</style>
