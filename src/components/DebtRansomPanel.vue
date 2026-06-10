<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameLock } from '../composables/useGameLock'
import { useKanaStats } from '../composables/useKanaStats'
import { useSrsSchedule } from '../composables/useSrsSchedule'
import { useToasts } from '../composables/useToasts'
import { checkRomajiAnswer } from '../utils/chunking'
import { kanaToRomaji, romajiToKana } from '../utils/romaji'
import { RANSOM_SIZE } from '../utils/debt'

// «Відкуп»: міні-дрил із найпростроченіших кан. Без підказок, без пропусків,
// одна помилка — пул перездається. 10/10 розблоковує ігри до кінця дня.
// Свідомо НЕ на useDrillDeck: тут не потрібні формати/скіпи, і сесія не має
// чіпати persisted-налаштування дрила.

const { debtCount, pool, payRansom, ransomInProgress } = useGameLock()
const stats = useKanaStats()
const { record: srsRecord } = useSrsSchedule()
const toasts = useToasts()

const status = ref<'idle' | 'playing' | 'failed'>('idle')
const cards = ref<string[]>([])
const idx = ref(0)
const answer = ref('')
const lastFail = ref('')

const currentKana = computed(() => cards.value[idx.value] ?? '')
const progressLabel = computed(() => `${idx.value} / ${cards.value.length}`)

const begin = () => {
  // Пул знімаємо знімком: відповіді переплановують картки в SRS, і реактивний
  // пул інакше мінявся б у нас під ногами.
  cards.value = [...pool.value]
  idx.value = 0
  answer.value = ''
  lastFail.value = ''
  status.value = cards.value.length > 0 ? 'playing' : 'idle'
  ransomInProgress.value = status.value === 'playing'
}

const submit = () => {
  const kana = currentKana.value
  const raw = answer.value.trim()
  if (!kana || !raw) return
  const ok = checkRomajiAnswer(kana, raw)
  const confused = romajiToKana(raw)
  stats.record(kana, ok, ok || !confused || confused === kana ? undefined : confused)
  srsRecord(kana, ok)
  answer.value = ''
  if (!ok) {
    lastFail.value = `${kana} = ${kanaToRomaji(kana)}, а не «${raw}»`
    status.value = 'failed'
    return
  }
  idx.value += 1
  if (idx.value >= cards.value.length) {
    payRansom()
    toasts.push({
      icon: '🔓',
      title: 'Борг сплачено',
      text: 'Ігри розблоковано до кінця дня. Кат задоволений.',
    })
  }
}
</script>

<template>
  <section class="panel debt-panel">
    <div class="debt-head">
      <span class="debt-icon" aria-hidden="true">🔒</span>
      <div>
        <h2>Борг повторень: {{ debtCount }} кан</h2>
        <p class="muted compact">
          Спідран і Пари замкнено, поки не сплатиш відкуп: {{ RANSOM_SIZE }} найпростроченіших кан
          поспіль без жодної помилки.
        </p>
      </div>
    </div>

    <button v-if="status === 'idle'" class="primary-button" type="button" @click="begin">
      🪓 Сплатити відкуп
    </button>

    <div v-else-if="status === 'playing'" class="debt-play">
      <div class="debt-progress">
        <span class="eyebrow">Без права на помилку</span>
        <strong>{{ progressLabel }}</strong>
      </div>
      <strong class="debt-kana" lang="ja">{{ currentKana }}</strong>
      <form class="drill-input-row" @submit.prevent="submit">
        <input
          v-model="answer"
          class="mic-select drill-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Ромадзі"
        >
        <button class="primary-button" type="submit" :disabled="!answer.trim()">Так</button>
      </form>
    </div>

    <div v-else class="debt-failed">
      <strong>💀 Кат не пробачає.</strong>
      <span>{{ lastFail }}</span>
      <button class="secondary-button" type="button" @click="begin">Спочатку</button>
    </div>
  </section>
</template>

<style scoped>
.debt-panel {
  display: grid;
  gap: 14px;
  padding: 20px 24px;
  border: 2px solid var(--rose-strong);
}

.debt-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.debt-icon {
  font-size: 1.8rem;
}

.debt-head h2 {
  margin: 0 0 4px;
}

.debt-head p {
  margin: 0;
}

.debt-play {
  display: grid;
  gap: 10px;
  justify-items: center;
}

.debt-progress {
  display: grid;
  justify-items: center;
  gap: 2px;
}

.debt-kana {
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 4rem;
  font-weight: 800;
  color: var(--ink);
}

.debt-failed {
  display: grid;
  gap: 8px;
  justify-items: start;
  color: var(--rose-strong);
}
</style>
