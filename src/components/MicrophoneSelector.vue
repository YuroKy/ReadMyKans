<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMicrophoneTest } from '../composables/useMicrophoneTest'

const {
  selectedDeviceId,
  micGain,
  noiseSuppression,
  monitor,
  devices,
  isTesting,
  audioLevel,
  error,
  setSelectedDeviceId,
  setMicGain,
  setNoiseSuppression,
  refreshDevices,
  startTest,
  stopTest,
} = useMicrophoneTest()

onMounted(() => refreshDevices())

const onDeviceChange = (event: Event) =>
  setSelectedDeviceId((event.target as HTMLSelectElement).value)

const toggleTest = () => (isTesting.value ? stopTest() : startTest())

const levelPct = computed(() => Math.round(audioLevel.value * 100))

const meterColor = computed(() => {
  const l = audioLevel.value
  if (l < 0.4) return 'var(--mint-strong)'
  if (l < 0.75) return 'var(--amber-strong)'
  return 'var(--rose-strong)'
})

const gainLabel = computed(() => `${Math.round(micGain.value * 100)}%`)

const onGainInput = (e: Event) => setMicGain(Number((e.target as HTMLInputElement).value))

const onNoiseToggle = (e: Event) => setNoiseSuppression((e.target as HTMLInputElement).checked)

const onMonitorToggle = (e: Event) => (monitor.value = (e.target as HTMLInputElement).checked)

const deviceCountLabel = computed(() => {
  const n = devices.value.length
  if (n === 1) return '1 пристрій'
  if (n >= 2 && n <= 4) return `${n} пристрої`
  return `${n} пристроїв`
})
</script>

<template>
  <div class="panel mic-selector-panel">
    <p class="eyebrow">Мікрофон</p>
    <h2 style="margin-bottom: 16px">Вибір та тест пристрою</h2>

    <!-- Вибір пристрою -->
    <div class="mic-device-row">
      <select
        id="mic-device-select"
        class="mic-select"
        :value="selectedDeviceId"
        @change="onDeviceChange"
      >
        <option value="">Системний за замовчуванням</option>
        <option
          v-for="device in devices"
          :key="device.deviceId"
          :value="device.deviceId"
        >
          {{ device.label || `Мікрофон (${device.deviceId.slice(0, 8)}…)` }}
        </option>
      </select>

      <button
        type="button"
        class="ghost-button small mic-refresh-btn"
        title="Оновити список пристроїв"
        aria-label="Оновити список пристроїв"
        @click="refreshDevices"
      >
        ↻
      </button>
    </div>

    <!-- Гучність мікрофона -->
    <div class="mic-gain-row">
      <span class="mic-gain-icon" aria-hidden="true">🎙</span>
      <input
        class="mic-gain-slider"
        type="range"
        min="0"
        max="10"
        step="0.05"
        :value="micGain"
        aria-label="Гучність мікрофона"
        @input="onGainInput"
      />
      <span class="mic-gain-value">{{ gainLabel }}</span>
    </div>

    <!-- Шумоподавлення -->
    <label class="mic-noise-row">
      <span class="mic-noise-text">
        <strong>Шумоподавлення</strong>
        <span class="mic-noise-sub">Прибирає фоновий шум між словами</span>
      </span>
      <span class="mic-switch">
        <input
          type="checkbox"
          :checked="noiseSuppression"
          aria-label="Шумоподавлення"
          @change="onNoiseToggle"
        />
        <span class="mic-switch-track" aria-hidden="true">
          <span class="mic-switch-thumb" />
        </span>
      </span>
    </label>

    <!-- Чути себе (моніторинг) -->
    <label class="mic-noise-row">
      <span class="mic-noise-text">
        <strong>Чути себе</strong>
        <span class="mic-noise-sub">Відтворює голос під час тесту</span>
      </span>
      <span class="mic-switch">
        <input
          type="checkbox"
          :checked="monitor"
          aria-label="Чути себе"
          @change="onMonitorToggle"
        />
        <span class="mic-switch-track" aria-hidden="true">
          <span class="mic-switch-thumb" />
        </span>
      </span>
    </label>

    <p v-if="isTesting && monitor" class="mic-feedback-warn">
      🎧 Скористайтесь навушниками, щоб уникнути зворотного звʼязку
    </p>

    <!-- Кнопка тесту -->
    <button
      type="button"
      class="secondary-button mic-test-btn"
      :class="{ 'is-testing': isTesting }"
      @click="toggleTest"
    >
      <span class="mic-rec-dot" :class="{ active: isTesting }" aria-hidden="true" />
      {{ isTesting ? 'Зупинити тест' : 'Розпочати тест' }}
    </button>

    <!-- VU-метр -->
    <div class="audio-meter" :class="{ 'is-active': isTesting }" aria-hidden="true">
      <div class="audio-meter-track">
        <div
          class="audio-meter-fill"
          :style="{ width: `${levelPct}%`, background: meterColor }"
        />
      </div>
      <span class="audio-meter-pct">{{ isTesting ? `${levelPct}%` : '' }}</span>
    </div>

    <!-- Статус -->
    <p v-if="error" class="field-error standalone">{{ error }}</p>
    <p v-else-if="isTesting" class="muted mic-hint">
      Говоріть — рівень відображається в реальному часі
    </p>
    <p v-else-if="!devices.length" class="muted mic-hint">
      Натисніть «Розпочати тест» щоб надати дозвіл і побачити пристрої
    </p>
    <p v-else class="muted mic-hint">
      Знайдено {{ deviceCountLabel }}. Обраний мікрофон буде використано при старті сесії.
    </p>
  </div>
</template>
