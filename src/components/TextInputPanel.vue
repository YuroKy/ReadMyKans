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

    <div v-if="fileInfo" class="file-summary">
      <span class="file-dot" aria-hidden="true"></span>
      <div>
        <strong>{{ fileInfo.name }}</strong>
        <span>
          {{ (fileInfo.size / 1024).toFixed(1) }} КБ · {{ fileInfo.characterCount }} знаків
        </span>
      </div>
    </div>
  </section>
</template>
