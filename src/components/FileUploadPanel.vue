<script setup lang="ts">
import type { UploadedFileInfo } from '../types'

const emit = defineEmits<{
  loaded: [text: string, info: UploadedFileInfo]
  error: [message: string]
}>()

const handleFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (file.type && file.type !== 'text/plain') {
    emit('error', 'Підтримуються лише файли .txt.')
    input.value = ''
    return
  }

  const reader = new FileReader()

  reader.onerror = () => {
    emit('error', 'Не вдалося прочитати файл. Спробуйте інший .txt файл.')
  }

  reader.onload = () => {
    const text = String(reader.result ?? '')
    emit('loaded', text, {
      name: file.name,
      size: file.size,
      characterCount: [...text].length,
    })
  }

  reader.readAsText(file)
}
</script>

<template>
  <section class="panel upload-panel">
    <div>
      <p class="eyebrow">Файл</p>
      <h2>Завантажте .txt</h2>
      <p class="muted">Текст буде додано в поле вище, і його можна змінити перед початком.</p>
    </div>

    <label class="upload-dropzone">
      <input type="file" accept=".txt,text/plain" @change="handleFile">
      <span class="upload-icon" aria-hidden="true">↑</span>
      <span>Вибрати текстовий файл</span>
    </label>
  </section>
</template>
