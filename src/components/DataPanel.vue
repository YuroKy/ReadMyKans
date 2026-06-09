<script setup lang="ts">
import { ref } from 'vue'
import { useDataTransfer } from '../composables/useDataTransfer'

const { exportData, importData } = useDataTransfer()

const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')

const onFile = async (event: Event) => {
  error.value = ''
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ok = await importData(file)
  if (!ok) error.value = 'Не вдалося імпортувати: невірний або пошкоджений файл.'
}
</script>

<template>
  <section class="panel data-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Дані</p>
        <h2>Прогрес</h2>
      </div>
    </div>

    <p class="muted compact">
      Збережи статистику, історію та налаштування у файл — або перенеси їх на інший пристрій.
    </p>

    <div class="data-actions">
      <button class="secondary-button" type="button" @click="exportData">Експортувати</button>
      <button class="ghost-button" type="button" @click="fileInput?.click()">Імпортувати</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        hidden
        @change="onFile"
      />
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>
  </section>
</template>

<style scoped>
.data-panel {
  padding: 22px;
  display: grid;
  gap: 12px;
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
