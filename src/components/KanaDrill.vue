<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useDrillDeck, type DrillFormat } from '../composables/useDrillDeck'
import { useDrillPrefs, type DrillTimerSetting } from '../composables/useDrillPrefs'
import { useCustomVocab } from '../composables/useCustomVocab'
import { useBestScores } from '../composables/useBestScores'
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
  isWordMode,
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
  combo,
  comboBurst,
  doneKana,
  growSize,
  growingActive,
  restart,
} = deck

const { best } = useBestScores()

const { rawText: customText, entries: customEntries, errors: customErrors } = useCustomVocab()

// Короткий сплеск анімації, коли комбо згоріло.
const comboShake = ref(false)
watch(comboBurst, () => {
  comboShake.value = false
  requestAnimationFrame(() => {
    comboShake.value = true
    window.setTimeout(() => {
      comboShake.value = false
    }, 600)
  })
})

const FORMATS: Array<{ id: DrillFormat; label: string; hint: string }> = [
  { id: 'recognition', label: 'Розпізнавання', hint: 'Бачиш кану → називаєш звук' },
  { id: 'dictation', label: 'Диктант', hint: 'Чуєш звук → пишеш кану' },
  { id: 'choice', label: 'Вибір', hint: 'Звук → обираєш кану' },
  { id: 'writing', label: 'Письмо', hint: 'Обведи кану за рисками' },
]

const { prefs } = useDrillPrefs()
const TIMER_OPTIONS: Array<{ id: DrillTimerSetting; label: string }> = [
  { id: 'off', label: 'Без часу' },
  { id: '5', label: '5 с' },
  { id: '3', label: '3 с' },
]
</script>

<template>
  <main class="drill-layout">
    <section class="session-hero drill-hero">
      <div>
        <p class="eyebrow">Урок кани</p>
        <h1>Практика кани</h1>
        <span v-if="drillMode === 'srs'" class="srs-due-badge"> 🔁 На сьогодні: {{ srsDueCount }} </span>
        <button class="ghost-button small drill-exit" type="button" @click="emit('exit')">← Вийти</button>
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
            <option value="executioner">🪓 Кат (мінімальні пари)</option>
            <option value="vocab">Словник N5</option>
            <option value="numbers">🔢 Числа і час</option>
            <option value="custom">📝 Мій словник</option>
            <optgroup label="Набори">
              <option v-for="set in kanaSets" :key="set.id" :value="set.id">{{ set.label }}</option>
            </optgroup>
          </select>
        </label>
        <div
          v-if="format === 'recognition' || format === 'dictation'"
          class="drill-format"
          role="group"
          aria-label="Таймер на картку"
        >
          <span class="eyebrow">Таймер</span>
          <div class="drill-format-toggle">
            <button
              v-for="t in TIMER_OPTIONS"
              :key="t.id"
              type="button"
              :class="{ active: prefs.timer === t.id }"
              @click="prefs.timer = t.id"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <div v-if="format === 'dictation'" class="drill-format" role="group" aria-label="Складність диктанту">
          <span class="eyebrow">Хардкор</span>
          <div class="drill-format-toggle">
            <button
              type="button"
              :class="{ active: !prefs.dictationHardcore }"
              title="Скільки завгодно прослуховувань і підказка"
              @click="prefs.dictationHardcore = false"
            >
              Звичайний
            </button>
            <button
              type="button"
              :class="{ active: prefs.dictationHardcore }"
              title="Одне прослуховування, без підказки"
              @click="prefs.dictationHardcore = true"
            >
              💀 1 раз
            </button>
            <button
              v-if="prefs.dictationHardcore"
              type="button"
              :class="{ active: prefs.dictationRate === 1.25 }"
              title="Пришвидшена вимова"
              @click="prefs.dictationRate = prefs.dictationRate === 1.25 ? 1 : 1.25"
            >
              ⏩ ×1.25
            </button>
          </div>
        </div>
        <div v-if="!isSingleKanaFormat && !isWordMode" class="drill-format" role="group" aria-label="Режим шматка">
          <span class="eyebrow">Шматок</span>
          <div class="drill-format-toggle">
            <button
              type="button"
              :class="{ active: !prefs.growing }"
              title="Фіксований розмір шматка"
              @click="prefs.growing = false"
            >
              Фіксований
            </button>
            <button
              type="button"
              :class="{ active: prefs.growing }"
              title="Росте на 1 кану після правильної відповіді, помилка скидає до 1"
              @click="prefs.growing = true"
            >
              📈 Росте
            </button>
          </div>
        </div>
        <label v-if="!isSingleKanaFormat && !isWordMode && !growingActive" class="drill-size">
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
      </div>
    </section>

    <section v-if="drillMode === 'custom'" class="panel custom-vocab-editor">
      <span class="eyebrow">Мій словник</span>
      <p class="custom-vocab-help">
        Один рядок — одне слово: <code>かな = переклад</code> або <code>かな, переклад</code>.
        Зберігається автоматично.
      </p>
      <textarea
        v-model="customText"
        class="custom-vocab-textarea"
        rows="6"
        placeholder="ねこ = котик
コーヒー, кава"
      />
      <p class="custom-vocab-help">Розпізнано слів: {{ customEntries.length }}</p>
      <ul v-if="customErrors.length" class="custom-vocab-errors">
        <li v-for="err in customErrors" :key="`${err.line}-${err.text}`">
          рядок {{ err.line }}: {{ err.reason }} — «{{ err.text }}»
        </li>
      </ul>
    </section>

    <p v-if="modeFellBack" class="drill-mode-note">
      Для цього режиму ще немає даних — тренуємо весь текст. Пограйся трохи, і тут зʼявляться твої
      слабкі кани та плутанини.
    </p>

    <section v-if="!isFinished && !srsEmpty" class="panel drill-progress">
      <span v-if="growingActive">
        Кана {{ Math.min(doneKana + 1, total) }} / {{ total }} · довжина <b>{{ growSize }}</b>
        <small v-if="best('drill:grow') > 1" class="grow-record">рекорд {{ best('drill:grow') }}</small>
      </span>
      <span v-else>Картка {{ Math.min(index + 1, total) }} / {{ total }}</span>
      <span class="drill-combo" :class="{ hot: combo >= 3, shake: comboShake }">
        {{ combo >= 3 ? `🔥 ×${combo}` : combo > 0 ? `×${combo}` : '' }}
      </span>
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
.drill-exit {
  display: flex;
  width: fit-content;
  margin-top: 14px;
}

.drill-format {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drill-format-toggle {
  display: inline-flex;
  flex-wrap: wrap;
  border-radius: 18px;
  background: var(--surface-inset);
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
  background: var(--surface-raised);
  color: var(--primary);
  box-shadow: var(--shadow);
}

.grow-record {
  margin-left: 6px;
  color: var(--muted);
}

.drill-combo {
  min-width: 3.5em;
  text-align: center;
  font-weight: 800;
  color: var(--muted);
  transition: color 0.2s ease;
}

.drill-combo.hot {
  color: var(--primary);
}

.drill-combo.shake {
  animation: combo-shake 0.5s ease;
  color: var(--rose-strong);
}

@keyframes combo-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
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

.custom-vocab-editor {
  display: grid;
  gap: 10px;
  padding: 16px 20px;
}

.custom-vocab-help {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.custom-vocab-textarea {
  width: 100%;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid var(--divider);
  border-radius: 12px;
  background: var(--surface-raised);
  color: var(--ink);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1rem;
}

.custom-vocab-errors {
  margin: 0;
  padding-left: 18px;
  font-size: 0.85rem;
  color: var(--rose-strong);
}
</style>
