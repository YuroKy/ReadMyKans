<script setup lang="ts">
import { computed } from 'vue'
import type { UploadedFileInfo } from '../types'
import { analyzeKana } from '../utils/kana'

const props = defineProps<{
  modelValue: string
  fileInfo: UploadedFileInfo | null
  error?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'start-drill': []
  'start-reading': []
}>()

const characterCount = computed(() => [...props.modelValue].length)
const kanaCount = computed(() => {
  const analysis = analyzeKana(props.modelValue)
  return analysis.hiraganaCount + analysis.katakanaCount
})

const updateText = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <section class="panel text-input-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Текст для читання</p>
        <h2>Вставте японський текст</h2>
      </div>
      <div class="counter-row" aria-label="Лічильники тексту">
        <span>{{ characterCount }} знаків</span>
        <span>{{ kanaCount }} кани</span>
      </div>
    </div>

    <textarea
      class="text-area"
      :value="modelValue"
      rows="12"
      placeholder="例：きょうは日本語を読みます。カタカナも練習します。"
      aria-label="Японський текст для читання"
      @input="updateText"
    />

    <p v-if="error" class="field-error">{{ error }}</p>

    <!-- Старт одразу під текстом: обрав/вставив — і поїхали, без скролу до hero. -->
    <div class="text-input-actions">
      <button class="secondary-button" type="button" @click="emit('start-drill')">
        Тренувати кану
      </button>
      <button class="primary-button" type="button" @click="emit('start-reading')">
        Почати читання
      </button>
    </div>

    <div v-if="fileInfo" class="file-summary">
      <span class="file-dot" aria-hidden="true" />
      <div>
        <strong>{{ fileInfo.name }}</strong>
        <span>
          {{ (fileInfo.size / 1024).toFixed(1) }} КБ · {{ fileInfo.characterCount }} знаків
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.text-input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 14px;
}

@media (max-width: 620px) {
  .text-input-actions {
    flex-direction: column;
  }
}
</style>
