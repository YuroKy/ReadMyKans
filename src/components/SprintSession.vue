<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { buildKanaSets, findKanaSet } from '../utils/kanaSets'
import type { SprintMode } from '../utils/sprint'
import { useSprint } from '../composables/useSprint'
import { track } from '../utils/analytics'
import SakuraDecor from './SakuraDecor.vue'

const emit = defineEmits<{ exit: []; finish: [] }>()

const sets = buildKanaSets()
const selectedSetId = ref('hiragana')
const mode = ref<SprintMode>('classic')
const pool = computed(() => {
  const set = findKanaSet(selectedSetId.value)
  return set ? [...set.kana] : []
})

const {
  status,
  timeLeft,
  isSuddenDeath,
  score,
  combo,
  bestCombo,
  target,
  targetRomaji,
  choices,
  lastCorrect,
  isNewRecord,
  previousBest,
  start,
  answer,
  reset,
} = useSprint(pool, mode)

// Let App reconcile achievements (e.g. «sprint 30+») when a run ends.
watch(status, (s) => {
  if (s === 'running') {
    track('sprint-start', { set: selectedSetId.value, mode: mode.value })
  }
  if (s === 'finished') {
    track('sprint-finish', {
      set: selectedSetId.value,
      mode: mode.value,
      score: score.value,
      bestCombo: bestCombo.value,
      newRecord: isNewRecord.value,
    })
    emit('finish')
  }
})

const exit = () => {
  reset()
  emit('exit')
}
</script>

<template>
  <main class="sprint-layout">
    <section class="session-hero">
      <SakuraDecor />
      <div>
        <p class="eyebrow">Міні-гра</p>
        <h1>⏱️ Спідран</h1>
      </div>
      <button class="ghost-button small" type="button" @click="exit">Вийти</button>
    </section>

    <section v-if="status === 'idle'" class="panel sprint-setup">
      <label class="drill-source">
        <span class="eyebrow">Набір кани</span>
        <select v-model="selectedSetId" class="mic-select">
          <option v-for="set in sets" :key="set.id" :value="set.id">{{ set.label }}</option>
        </select>
      </label>
      <div class="sprint-mode-toggle" role="group" aria-label="Режим спідрану">
        <button
          type="button"
          class="mode-pill"
          :class="{ active: mode === 'classic' }"
          @click="mode = 'classic'"
        >
          ⏱️ Класика 60 с
        </button>
        <button
          type="button"
          class="mode-pill"
          :class="{ active: mode === 'suddendeath' }"
          @click="mode = 'suddendeath'"
        >
          💀 Раптова смерть
        </button>
      </div>
      <p class="muted compact">
        <template v-if="mode === 'suddendeath'">
          Без таймера. Одна помилка — і все. Рекорд серії: <b>{{ previousBest }}</b>
        </template>
        <template v-else>
          За 60 секунд познач якомога більше кан правильно. Рекорд: <b>{{ previousBest }}</b>
        </template>
      </p>
      <button class="primary-button" type="button" :disabled="pool.length === 0" @click="start">
        Старт
      </button>
    </section>

    <section v-else-if="status === 'running'" class="panel sprint-play">
      <div class="sprint-hud">
        <div v-if="!isSuddenDeath" class="sprint-hud-item time" :class="{ low: timeLeft <= 10 }">
          <span class="eyebrow">Час</span>
          <strong>{{ timeLeft }}</strong>
        </div>
        <div v-else class="sprint-hud-item">
          <span class="eyebrow">Режим</span>
          <strong>💀</strong>
        </div>
        <div class="sprint-hud-item">
          <span class="eyebrow">Очки</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="sprint-hud-item">
          <span class="eyebrow">Комбо</span>
          <strong>{{ combo >= 3 ? `🔥 ${combo}` : combo }}</strong>
        </div>
      </div>

      <div class="sprint-prompt">
        <span class="eyebrow">Яка це кана?</span>
        <strong>{{ targetRomaji || '—' }}</strong>
      </div>

      <div class="sprint-grid" role="group" aria-label="Варіанти кани">
        <button
          v-for="tile in choices"
          :key="tile + target"
          type="button"
          class="sprint-tile"
          @click="answer(tile)"
        >
          {{ tile }}
        </button>
      </div>

      <p class="sprint-feedback" :class="{ ok: lastCorrect === true, bad: lastCorrect === false }">
        <span v-if="lastCorrect === true">✓</span>
        <span v-else-if="lastCorrect === false">✗</span>
        <span v-else>&nbsp;</span>
      </p>
    </section>

    <section v-else class="panel sprint-result">
      <SakuraDecor density="rich" />
      <p class="eyebrow">{{ isSuddenDeath ? `Серія обірвалась на ${score}` : 'Час вийшов' }}</p>
      <h1>{{ isNewRecord ? '🏆 Новий рекорд!' : 'Готово!' }}</h1>

      <div class="accuracy-ring big" :style="{ '--score': '100%' }">
        <strong>{{ score }}</strong>
        <span>{{ isSuddenDeath ? 'серія' : 'очок' }}</span>
      </div>

      <div class="sprint-result-stats">
        <span>Найкраще комбо: <b>{{ bestCombo }}</b></span>
        <span>Рекорд: <b>{{ previousBest }}</b></span>
      </div>

      <div class="session-actions">
        <button class="primary-button" type="button" @click="start">Ще раз</button>
        <button class="secondary-button" type="button" @click="exit">Вийти</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.sprint-layout {
  display: grid;
  gap: 18px;
}

.sprint-setup {
  display: grid;
  gap: 14px;
  justify-items: start;
  padding: 24px;
}

.sprint-mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-pill {
  border: 2px solid var(--divider);
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--muted);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 8px 16px;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.mode-pill.active {
  border-color: var(--primary);
  color: var(--ink);
  background: var(--surface-inset);
}

.sprint-play {
  display: grid;
  gap: 18px;
  justify-items: center;
  padding: 24px;
}

.sprint-hud {
  display: flex;
  gap: 28px;
  width: 100%;
  justify-content: center;
}

.sprint-hud-item {
  display: grid;
  justify-items: center;
  gap: 2px;
}

.sprint-hud-item strong {
  font-size: 1.8rem;
  color: var(--ink);
}

.sprint-hud-item.time.low strong {
  color: var(--rose-strong);
}

.sprint-prompt {
  display: grid;
  justify-items: center;
  gap: 4px;
}

.sprint-prompt strong {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--ink);
}

.sprint-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 320px;
}

.sprint-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  border: 2px solid var(--divider);
  border-radius: 22px;
  background: var(--surface-raised);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 2.6rem;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  transition: transform 0.1s ease, border-color 0.15s ease;
}

.sprint-tile:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
}

.sprint-tile:active {
  transform: scale(0.96);
}

.sprint-feedback {
  margin: 0;
  height: 1.6rem;
  font-size: 1.4rem;
  font-weight: 800;
}

.sprint-feedback.ok {
  color: var(--mint-strong);
}

.sprint-feedback.bad {
  color: var(--rose-strong);
}

/* Плитки вище жорстко білі; в темній темі --ink світлий, тож без
   темної поверхні кана на плитках була б невидимою. */
[data-theme='dark'] .sprint-tile {
  background: #2c2640;
}

.sprint-result {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 14px;
  text-align: center;
  padding: 32px 24px;
}

.sprint-result-stats {
  display: flex;
  gap: 22px;
  color: var(--muted);
  font-size: 0.9rem;
}
</style>
