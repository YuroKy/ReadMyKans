<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { DrillDeck } from '../composables/useDrillDeck'
import { shuffleTiles } from '../utils/anagram'
import { speakKana, isSpeechSynthesisSupported } from '../utils/kanaSpeech'
import { kanaToRomaji } from '../utils/romaji'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{ deck: DrillDeck }>()
const {
  expectedKana,
  expectedRomaji,
  currentChunk,
  lastOutcome,
  isWordMode,
  currentTranslation,
  index,
  sessionToken,
  answerKana,
  retry,
  skip,
} = props.deck

const tiles = ref<string[]>([])
// Зібрана відповідь — індекси плиток (не самі кани): дублі плиток мають
// гаснути по одній.
const picked = ref<number[]>([])

const rebuild = () => {
  picked.value = []
  tiles.value = shuffleTiles(currentChunk.value)
}

watch([index, sessionToken], rebuild)
onMounted(rebuild)

const assembled = computed(() => picked.value.map((i) => tiles.value[i] ?? '').join(''))

const ttsSupported = isSpeechSynthesisSupported()
const speak = () => speakKana(expectedKana.value, { rate: 0.8 })

// Промпт: у словесних режимах — переклад (продукування слова), у текстовому —
// ромадзі шматка. Звук доступний завжди.
const prompt = computed(() =>
  isWordMode.value && currentTranslation.value ? currentTranslation.value : expectedRomaji.value,
)

const tap = (slot: number) => {
  if (lastOutcome.value || picked.value.includes(slot)) return
  picked.value.push(slot)
  if (picked.value.length === tiles.value.length) {
    answerKana(assembled.value)
  }
}

const undo = () => {
  if (lastOutcome.value) return
  picked.value.pop()
}

const tryAgain = () => {
  retry()
  picked.value = []
}
</script>

<template>
  <section
    class="panel drill-card"
    :class="{ correct: lastOutcome === 'correct', wrong: lastOutcome === 'wrong' }"
  >
    <SakuraDecor />
    <div class="anagram-prompt">
      <span class="eyebrow">Збери з плиток</span>
      <div class="anagram-prompt-row">
        <strong class="anagram-prompt-text">{{ prompt || '—' }}</strong>
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

    <div class="anagram-slots" aria-label="Зібрана відповідь">
      <span
        v-for="(_, position) in tiles.length"
        :key="position"
        class="anagram-slot"
        :class="{ filled: position < picked.length }"
      >
        {{ tiles[picked[position] ?? -1] ?? '＿' }}
      </span>
      <button
        class="ghost-button small"
        type="button"
        :disabled="!!lastOutcome || picked.length === 0"
        aria-label="Прибрати останню кану"
        @click="undo"
      >
        ⌫
      </button>
    </div>

    <div class="anagram-tiles" role="group" aria-label="Плитки кани">
      <button
        v-for="(tile, slot) in tiles"
        :key="`${slot}-${tile}`"
        type="button"
        class="anagram-tile"
        :class="{ used: picked.includes(slot) }"
        :disabled="!!lastOutcome || picked.includes(slot)"
        @click="tap(slot)"
      >
        {{ tile }}
      </button>
    </div>

    <div v-if="!lastOutcome" class="drill-sub-actions">
      <button class="ghost-button small" type="button" @click="skip()">Пропустити</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 3 картки" @click="skip(3)">×3</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 5 карток" @click="skip(5)">×5</button>
      <button class="ghost-button small" type="button" aria-label="Пропустити 10 карток" @click="skip(10)">×10</button>
    </div>

    <div v-if="lastOutcome === 'correct'" class="drill-feedback ok">
      <strong>✓ Правильно!</strong>
      <span>{{ expectedKana }} = {{ expectedRomaji }}</span>
      <span v-if="currentTranslation">📖 {{ currentTranslation }}</span>
    </div>

    <div v-else-if="lastOutcome === 'wrong'" class="drill-feedback bad">
      <strong>✗ Не зараховано</strong>
      <span>Ви зібрали: <b>{{ assembled || '—' }}</b></span>
      <span>Правильно: <b>{{ expectedKana }}</b> = <b>{{ expectedRomaji }}</b></span>
      <span v-if="currentTranslation">📖 {{ currentTranslation }}</span>

      <div class="drill-actions">
        <button class="secondary-button" type="button" @click="tryAgain">Спробувати ще</button>
        <button class="primary-button" type="button" @click="skip()">Далі</button>
      </div>
    </div>

    <div v-if="lastOutcome && currentChunk.length > 1" class="drill-breakdown">
      <span v-for="(k, i) in currentChunk" :key="i" class="drill-kana-chip">
        {{ k }}<small>{{ kanaToRomaji(k) }}</small>
      </span>
    </div>
  </section>
</template>

<style scoped>
.anagram-prompt {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.anagram-prompt-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.anagram-prompt-text {
  font-size: 1.6rem;
  font-weight: 800;
  text-align: center;
  color: var(--ink);
}

.anagram-slots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.anagram-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 52px;
  padding: 0 6px;
  border-bottom: 3px solid var(--divider);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--muted);
}

.anagram-slot.filled {
  border-bottom-color: var(--primary);
  color: var(--ink);
}

.anagram-tiles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 420px;
}

.anagram-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 56px;
  padding: 0 10px;
  border: 2px solid var(--divider);
  border-radius: 16px;
  background: var(--surface-raised);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.anagram-tile:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.anagram-tile.used {
  opacity: 0.25;
}

.anagram-tile:disabled {
  cursor: default;
}
</style>
