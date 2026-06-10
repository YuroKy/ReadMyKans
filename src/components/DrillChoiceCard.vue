<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import { kanaContrast } from '../utils/kanaContrast'
import { buildChoices } from '../utils/drillDistractors'
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

onMounted(buildTiles)
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
        v-for="tile in choices"
        :key="tile"
        type="button"
        class="drill-choice-tile"
        :class="tileClass(tile)"
        :disabled="!!lastOutcome"
        @click="choose(tile)"
      >
        {{ tile }}
      </button>
    </div>

    <div v-if="!lastOutcome" class="drill-sub-actions">
      <button class="ghost-button small" type="button" @click="skip">Пропустити</button>
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

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip">Далі</button>
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
</style>
