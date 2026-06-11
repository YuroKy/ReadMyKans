<script setup lang="ts">
import { computed, ref } from 'vue'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'
import { applyDakuten, toSmallKana } from '../utils/kanaCompose'

// Екранна ґодзюон-клавіатура: набирає кану у value (v-model-патерн через
// emit). Службові клавіші ゛/゜/«мала» діють на останній набраний символ.
const props = defineProps<{ value: string }>()
const emit = defineEmits<{ update: [value: string] }>()

const script = ref<'hiragana' | 'katakana'>('hiragana')
const rows = computed(() => (script.value === 'hiragana' ? HIRAGANA_ROWS : KATAKANA_ROWS))

const lastChar = computed(() => [...props.value].slice(-1)[0] ?? '')
const withoutLast = () => [...props.value].slice(0, -1).join('')

const tap = (kana: string) => emit('update', props.value + kana)
const backspace = () => emit('update', withoutLast())

const dakuten = (mark: '゛' | '゜') => {
  const composed = applyDakuten(lastChar.value, mark)
  if (composed && composed !== lastChar.value) emit('update', withoutLast() + composed)
}

const small = () => {
  const shrunk = toSmallKana(lastChar.value)
  if (shrunk) emit('update', withoutLast() + shrunk)
}
</script>

<template>
  <div class="kana-keyboard">
    <div class="kana-keyboard-tabs">
      <button
        type="button"
        :class="{ active: script === 'hiragana' }"
        @click="script = 'hiragana'"
      >
        あ хіра
      </button>
      <button
        type="button"
        :class="{ active: script === 'katakana' }"
        @click="script = 'katakana'"
      >
        ア ката
      </button>
    </div>

    <div class="kana-keyboard-grid">
      <template v-for="(row, r) in rows" :key="r">
        <button
          v-for="(kana, c) in row"
          :key="`${r}-${c}`"
          type="button"
          class="kana-key"
          :class="{ blank: !kana }"
          :disabled="!kana"
          :tabindex="kana ? undefined : -1"
          @click="kana && tap(kana)"
        >
          {{ kana || '' }}
        </button>
      </template>
    </div>

    <div class="kana-keyboard-service">
      <button type="button" class="kana-key service" title="Дзвінкість (か→が)" @click="dakuten('゛')">゛</button>
      <button type="button" class="kana-key service" title="«П» (は→ぱ)" @click="dakuten('゜')">゜</button>
      <button type="button" class="kana-key service" title="Мала кана (や→ゃ, つ→っ)" @click="small()">小</button>
      <button type="button" class="kana-key service" :title="'ー (довгота)'" @click="tap('ー')">ー</button>
      <button
        type="button"
        class="kana-key service"
        aria-label="Стерти останню кану"
        :disabled="!value"
        @click="backspace"
      >
        ⌫
      </button>
    </div>
  </div>
</template>

<style scoped>
.kana-keyboard {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.kana-keyboard-tabs {
  display: inline-flex;
  gap: 6px;
}

.kana-keyboard-tabs button {
  padding: 4px 12px;
  border: 1px solid var(--divider);
  border-radius: 999px;
  background: var(--surface-raised);
  color: var(--muted);
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
}

.kana-keyboard-tabs button.active {
  border-color: var(--primary);
  color: var(--primary);
}

.kana-keyboard-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
  max-width: 300px;
}

.kana-keyboard-service {
  display: inline-flex;
  gap: 6px;
}

.kana-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border: 1px solid var(--divider);
  border-radius: 10px;
  background: var(--surface-raised);
  font-family: "Noto Sans JP", "Plus Jakarta Sans", sans-serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  transition: border-color 0.12s ease, transform 0.12s ease;
}

.kana-key:hover:not(:disabled) {
  border-color: var(--primary);
  transform: translateY(-1px);
}

.kana-key.blank {
  visibility: hidden;
}

.kana-key.service {
  min-width: 44px;
}

.kana-key:disabled {
  cursor: default;
}
</style>
