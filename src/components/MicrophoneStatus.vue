<script setup lang="ts">
import type { SessionStatus } from '../types'

const statusLabels: Record<SessionStatus, string> = {
  idle: 'Готово',
  listening: 'Слухаю',
  paused: 'Пауза',
  finished: 'Завершено',
  error: 'Потрібна увага',
}

defineProps<{
  status: SessionStatus
  supported: boolean
  message?: string
}>()
</script>

<template>
  <div class="mic-status" :class="[`is-${status}`, { unsupported: !supported }]">
    <span class="mic-pulse" aria-hidden="true" />
    <div>
      <strong>{{ supported ? statusLabels[status] : 'Ручний режим' }}</strong>
      <span>
        {{
          message ||
            (supported
              ? 'Розпізнавання налаштоване на японську мову.'
              : 'Web Speech API недоступний у цьому браузері.')
        }}
      </span>
    </div>
  </div>
</template>
