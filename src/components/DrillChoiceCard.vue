<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import { kanaContrast } from '../utils/kanaContrast'
import { mnemonicFor } from '../data/mnemonics'
import { buildChoices } from '../utils/drillDistractors'
import { clusterFor } from '../utils/minimalPairs'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{ deck: DrillDeck }>()
const {
  expectedKana,
  expectedRomaji,
  lastOutcome,
  lastConfused,
  index,
  sessionToken,
  stats,
  drillMode,
  answerKana,
  retry,
  skip,
} = props.deck

const chosen = ref('')
const choices = ref<string[]>([])

const buildTiles = () => {
  const target = expectedKana.value
  if (!target) {
    choices.value = []
    return
  }
  const confusions = Object.keys(stats.statFor(target).confusedWith)
  // «Кат» подає дистрактори з кластера мінімальних пар цієї ж кани — щоб
  // відповідь не вгадувалась за «несхожістю» плиток.
  if (drillMode.value === 'executioner') confusions.push(...clusterFor(target))
  choices.value = buildChoices(target, { confusions, count: 3 })
}

watch([index, sessionToken], () => {
  chosen.value = ''
  buildTiles()
})

const ttsSupported = isSpeechSynthesisSupported()
const speak = () => speakKana(expectedKana.value, { rate: 0.8 })

const choose = (tile: string) => {
  if (lastOutcome.value) return
  chosen.value = tile
  answerKana(tile)
}

const tileClass = (tile: string) => {
  if (!lastOutcome.value) return ''
  if (tile === expectedKana.value) return 'correct'
  if (tile === chosen.value) return 'wrong'
  return 'dim'
}

const tryAgain = () => {
  retry()
  chosen.value = ''
}

const contrast = computed(() =>
  lastOutcome.value === 'wrong' && lastConfused.value
    ? kanaContrast(expectedKana.value, lastConfused.value)
    : null,
)

const mnemonic = computed(() => mnemonicFor(expectedKana.value))

// Десктоп: клавіші 1–4 тапають відповідну плитку.
const onKeydown = (event: KeyboardEvent) => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
  const slot = Number.parseInt(event.key, 10) - 1
  const tile = slot >= 0 ? choices.value[slot] : undefined
  if (!tile) return
  event.preventDefault()
  choose(tile)
}

onMounted(() => {
  buildTiles()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section
    class="panel drill-card"
    :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
  >
    <SakuraDecor />
    <div class="drill-choice-prompt">
      <span class="eyebrow">Яка це кана?</span>
      <div class="drill-choice-romaji-row">
        <strong class="drill-choice-romaji">{{ expectedRomaji || '—' }}</strong>
        <button
          v-if="ttsSupported"
          class="speaker-button"
          type="button"
          title="Послухати вимову"
          aria-label="Послухати вимову"
          @click="speak"
        >
          ▷
        </button>
      </div>
    </div>

    <div class="drill-choice-grid" role="group" aria-label="Варіанти кани">
      <button
        v-for="(tile, slot) in choices"
        :key="tile"
        type="button"
        class="drill-choice-tile"
        :class="tileClass(tile)"
        :disabled="!!lastOutcome"
        @click="choose(tile)"
      >
        {{ tile }}
        <span class="tile-hotkey" aria-hidden="true">{{ slot + 1 }}</span>
      </button>
    </div>

    <div v-if="!lastOutcome" class="drill-sub-actions">
      <button class="ghost-button small" type="button" @click="skip()">Пропустити</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 3 кани" @click="skip(3)">×3</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 5 кан" @click="skip(5)">×5</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 10 кан" @click="skip(10)">×10</button>
    </div>

    <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
      <strong>✓ Правильно!</strong>
      <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
    </div>

    <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
      <strong>✗ Не зараховано</strong>
      <span>Ви обрали: <b>{{ chosen || '—' }}</b></span>
      <span>Правильно: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span>

      <p v-if="contrast" class="drill-contrast">
        {{ contrast.note }}
      </p>
      <p v-if="mnemonic" class="drill-contrast">🧠 {{ mnemonic }}</p>

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip()">Далі</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.drill-choice-prompt {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.drill-choice-romaji-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.drill-choice-romaji {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.drill-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.drill-choice-tile {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  border: 2px solid var(--divider);
  border-radius: 22px;
  background: var(--surface-raised);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.15s ease, background 0.15s ease;
}

.drill-choice-tile:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.drill-choice-tile:disabled {
  cursor: default;
}

.drill-choice-tile.correct {
  border-color: var(--mint-strong);
  background: var(--mint);
  color: var(--mint-strong);
}

.drill-choice-tile.wrong {
  border-color: var(--rose-strong);
  background: var(--rose);
  color: var(--rose-strong);
}

.drill-choice-tile.dim {
  opacity: 0.45;
}

/* Бейдж гарячої клавіші — лише там, де є фізична клавіатура. */
.tile-hotkey {
  display: none;
  position: absolute;
  top: 8px;
  left: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--muted);
}

@media (hover: hover) and (pointer: fine) {
  .tile-hotkey {
    display: block;
  }
}
</style>
