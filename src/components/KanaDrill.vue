<script setup lang="ts">
import { toRef } from 'vue'
import { useDrillDeck, type DrillFormat } from '../composables/useDrillDeck'
import { kanaToRomaji } from '../utils/romaji'
import DrillRecognitionCard from './DrillRecognitionCard.vue'
import DrillDictationCard from './DrillDictationCard.vue'
import DrillChoiceCard from './DrillChoiceCard.vue'
import DrillWritingCard from './DrillWritingCard.vue'
import SakuraDecor from './SakuraDecor.vue'

const props = defineProps<{ sourceText: string }>()
const emit = defineEmits<{ exit: [] }>()

const deck = useDrillDeck(toRef(props, 'sourceText'))
const {
  format,
  chunkSize,
  isSingleKanaFormat,
  chunkLabel,
  drillMode,
  kanaSets,
  modeFellBack,
  srsDueCount,
  srsEmpty,
  total,
  index,
  isFinished,
  correctCount,
  wrongCount,
  accuracy,
  headline,
  difficulty,
  difficultyTiers,
  donutGradient,
  drillConfusions,
  weakSummary,
  restart,
} = deck

const FORMATS: Array<{ id: DrillFormat; label: string; hint: string }> = [
  { id: 'recognition', label: 'Впізнавання', hint: 'Бачиш кану → називаєш звук' },
  { id: 'dictation', label: 'Диктант', hint: 'Чуєш звук → пишеш кану' },
  { id: 'choice', label: 'Вибір', hint: 'Звук → обираєш кану' },
  { id: 'writing', label: 'Письмо', hint: 'Обведи кану за рисками' },
]
</script>

<template>
  <main class="drill-layout">
    <section class="session-hero drill-hero">
      <div>
        <p class="eyebrow">Урок кани</p>
        <h1>Практика кани</h1>
        <span v-if="drillMode === 'srs'" class="srs-due-badge"> 🔁 На сьогодні: {{ srsDueCount }} </span>
      </div>
      <div class="drill-controls">
        <div class="drill-format" role="group" aria-label="Формат тренування">
          <span class="eyebrow">Формат</span>
          <div class="drill-format-toggle">
            <button
              v-for="f in FORMATS"
              :key="f.id"
              type="button"
              :class="{ active: format === f.id }"
              :title="f.hint"
              @click="format = f.id"
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <label class="drill-source">
          <span class="eyebrow">Джерело</span>
          <select v-model="drillMode" class="mic-select">
            <option value="text">Весь текст</option>
            <option value="srs">Повторення на сьогодні</option>
            <option value="weak">Слабкі кани</option>
            <option value="confusions">Мої плутанини</option>
            <optgroup label="Набори">
              <option v-for="set in kanaSets" :key="set.id" :value="set.id">{{ set.label }}</option>
            </optgroup>
          </select>
        </label>
        <label v-if="!isSingleKanaFormat" class="drill-size">
          <span class="eyebrow">Розмір шматка: {{ chunkLabel }}</span>
          <input
            v-model.number="chunkSize"
            type="range"
            min="1"
            max="6"
            step="1"
            class="mic-gain-slider"
          >
        </label>
        <button class="ghost-button small" type="button" @click="emit('exit')">Вийти</button>
      </div>
    </section>

    <p v-if="modeFellBack" class="drill-mode-note">
      Для цього режиму ще немає даних — тренуємо весь текст. Пограйся трохи, і тут зʼявляться твої
      слабкі кани та плутанини.
    </p>

    <section v-if="!isFinished && !srsEmpty" class="panel drill-progress">
      <span>Картка {{ Math.min(index + 1, total) }} / {{ total }}</span>
      <strong>{{ correctCount }} правильних</strong>
    </section>

    <template v-if="isFinished">
      <section class="panel result-summary">
        <SakuraDecor density="rich" />
        <div class="result-summary-main">
          <div class="result-summary-head">
            <p class="eyebrow">Підсумок практики</p>
            <h1>{{ headline.title }}</h1>
            <p class="result-subtitle">{{ headline.subtitle }}</p>
          </div>
          <span class="result-badge">🌸 {{ correctCount }} / {{ total }} правильних</span>
        </div>

        <div class="accuracy-ring big" :style="{ '--score': `${accuracy}%` }">
          <strong>{{ accuracy }}%</strong>
          <span>точність</span>
        </div>
      </section>

      <section class="result-stats">
        <div class="panel mini-stat">
          <span>Карток усього</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="panel mini-stat accent-ok">
          <span>Правильних</span>
          <strong>{{ correctCount }}</strong>
        </div>
        <div class="panel mini-stat accent-bad">
          <span>Помилок</span>
          <strong>{{ wrongCount }}</strong>
        </div>
        <div class="panel mini-stat">
          <span>Кан у тексті</span>
          <strong>{{ difficulty.total }}</strong>
        </div>
      </section>

      <section class="result-insights">
        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Розбір</p>
              <h2>Складність кани</h2>
            </div>
          </div>

          <div class="difficulty-body">
            <div
              class="difficulty-donut"
              :style="{ '--donut': donutGradient }"
              role="img"
              aria-label="Розподіл кани за складністю"
            >
              <strong>{{ difficulty.total }}</strong>
              <span>кан</span>
            </div>
            <ul class="difficulty-legend">
              <li v-for="tier in difficultyTiers" :key="tier.key" :class="tier.key">
                <span class="difficulty-dot" />
                <span class="difficulty-label">{{ tier.label }}</span>
                <strong>{{ tier.count }}</strong>
                <small>({{ tier.pct }}%)</small>
              </li>
            </ul>
          </div>
        </article>

        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Помилки</p>
              <h2>Найчастіші плутанини</h2>
            </div>
          </div>

          <ul v-if="drillConfusions.length" class="confusion-list">
            <li v-for="pair in drillConfusions" :key="`${pair.a}-${pair.b}`" class="confusion-row">
              <span class="confusion-pair">
                <b>{{ pair.a }}</b>
                <i>↔</i>
                <b>{{ pair.b }}</b>
              </span>
              <span class="confusion-count">{{ pair.count }}</span>
            </li>
          </ul>
          <p v-else class="empty-copy">Цього разу плутанини не зафіксовано. Так тримати! 🌸</p>
        </article>

        <article class="panel insight-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Повторення</p>
              <h2>Варто повторити</h2>
            </div>
          </div>

          <div v-if="weakSummary.length" class="drill-weak-list">
            <span v-for="w in weakSummary" :key="w.kana" class="drill-weak-chip">
              <strong>{{ w.kana }}</strong>
              <small>{{ kanaToRomaji(w.kana) }} · {{ w.wrong }} помилок</small>
            </span>
          </div>
          <p v-else class="empty-copy">Слабких кан поки немає — гарно йде! 🌸</p>
        </article>
      </section>

      <section class="session-actions" aria-label="Подальші дії">
        <button class="primary-button" type="button" @click="restart">Спочатку</button>
        <button class="secondary-button" type="button" @click="emit('exit')">До тексту</button>
      </section>
    </template>

    <section v-else-if="srsEmpty" class="panel srs-empty">
      <SakuraDecor density="rich" />
      <h2>🌸 На сьогодні нічого повторювати</h2>
      <p>
        Ти повторив усю заплановану на сьогодні кану. Обери інший режим джерела вище або повертайся
        завтра — інтервальне повторення підбере, що пора освіжити.
      </p>
      <button class="secondary-button" type="button" @click="emit('exit')">До тексту</button>
    </section>

    <DrillRecognitionCard v-else-if="format === 'recognition'" :deck="deck" />
    <DrillDictationCard v-else-if="format === 'dictation'" :deck="deck" />
    <DrillChoiceCard v-else-if="format === 'choice'" :deck="deck" />
    <DrillWritingCard v-else :deck="deck" />
  </main>
</template>

<style scoped>
.drill-format {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drill-format-toggle {
  display: inline-flex;
  flex-wrap: wrap;
  border-radius: 999px;
  background: #fff3f6;
  padding: 3px;
  gap: 2px;
}

.drill-format-toggle button {
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.drill-format-toggle button.active {
  background: #ffffff;
  color: var(--primary);
  box-shadow: var(--shadow);
}

.drill-mode-note {
  margin: 0;
  padding: 12px 18px;
  border-radius: 16px;
  background: var(--sky);
  color: var(--sky-strong);
  font-size: 0.9rem;
  font-weight: 600;
}

.srs-due-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--mint);
  color: var(--mint-strong);
  font-weight: 800;
  font-size: 0.85rem;
}

.srs-empty {
  position: relative;
  display: grid;
  gap: 12px;
  justify-items: center;
  text-align: center;
  padding: 36px 24px;
}

.srs-empty h2 {
  margin: 0;
}

.srs-empty p {
  margin: 0;
  max-width: 46ch;
  color: var(--muted);
}
</style>
