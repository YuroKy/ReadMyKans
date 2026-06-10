import { ref } from 'vue'

export interface Toast {
  id: string
  icon?: string
  title: string
  text?: string
  // Якщо тост святкує ачивку — хост рендерить SVG-медальйон замість emoji.
  achievementId?: string
}

// Module-level singleton queue so any composable can raise a celebratory toast
// and a single host (App.vue) renders them.
const toasts = ref<Toast[]>([])
let seq = 0

const TTL = 5000

export const useToasts = () => {
  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const push = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${(seq += 1)}`
    toasts.value = [...toasts.value, { id, ...toast }]
    if (typeof window !== 'undefined') {
      window.setTimeout(() => dismiss(id), TTL)
    }
  }

  return { toasts, push, dismiss }
}
