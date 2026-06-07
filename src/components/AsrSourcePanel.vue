<script setup lang="ts">
import { onMounted } from 'vue'
import { useAsrPreference, type AsrEnginePreference } from '../composables/useAsrPreference'
import { useAsrDiagnostics, type SourceState } from '../composables/useAsrDiagnostics'

const { enginePreference, setPreference } = useAsrPreference()
const { server, browser, isChecking, checkAll } = useAsrDiagnostics()

onMounted(() => checkAll())

const MODES: { key: AsrEnginePreference; label: string; hint: string }[] = [
  {
    key: 'auto',
    label: 'Авто',
    hint: 'Спочатку локальний сервер, при невдачі — Web Speech API',
  },
  {
    key: 'server',
    label: 'Локальний сервер',
    hint: 'Тільки sherpa-onnx (потрібен npm run dev:server), без fallback',
  },
  {
    key: 'browser',
    label: 'Web Speech API',
    hint: 'Хмарне Google, потрібен інтернет. Бере СИСТЕМНИЙ мікрофон за замовчуванням (ігнорує вибір нижче)',
  },
]

const badge = (state: SourceState) => {
  switch (state) {
    case 'ok':
      return { cls: 'ok', text: '● Доступно' }
    case 'fail':
      return { cls: 'fail', text: '● Недоступно' }
    case 'checking':
      return { cls: 'checking', text: '○ Перевірка…' }
    default:
      return { cls: 'unknown', text: '○ —' }
  }
}
</script>

<template>
  <div class="panel asr-source-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Розпізнавання</p>
        <h2>Джерело та режим</h2>
      </div>
      <button
        type="button"
        class="ghost-button small"
        :disabled="isChecking"
        @click="checkAll"
      >
        {{ isChecking ? 'Перевірка…' : 'Перевірити' }}
      </button>
    </div>

    <!-- Вибір режиму -->
    <div class="asr-mode-list" role="group" aria-label="Режим розпізнавання">
      <button
        v-for="mode in MODES"
        :key="mode.key"
        type="button"
        class="asr-mode"
        :class="{ active: enginePreference === mode.key }"
        @click="setPreference(mode.key)"
      >
        <span class="asr-mode-radio" aria-hidden="true" />
        <span class="asr-mode-body">
          <strong>{{ mode.label }}</strong>
          <span>{{ mode.hint }}</span>
        </span>
      </button>
    </div>

    <!-- Живі статуси джерел -->
    <div class="asr-status-list">
      <div class="asr-status-row">
        <span class="asr-status-name">Локальний сервер</span>
        <span class="asr-status-badge" :class="badge(server.state).cls">
          {{ badge(server.state).text }}
        </span>
      </div>
      <p class="asr-status-detail">{{ server.message }}</p>

      <div class="asr-status-row">
        <span class="asr-status-name">Web Speech API</span>
        <span class="asr-status-badge" :class="badge(browser.state).cls">
          {{ badge(browser.state).text }}
        </span>
      </div>
      <p class="asr-status-detail">{{ browser.message }}</p>
    </div>
  </div>
</template>
