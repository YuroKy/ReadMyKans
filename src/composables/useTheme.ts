import { ref } from 'vue'
import { track } from '../utils/analytics'

export type Theme = 'light' | 'dark'

const KEY = 'kana-theme'

// Pure resolution of the initial theme — stored preference wins, otherwise the
// OS preference, otherwise light.
export const resolveInitialTheme = (stored: string | null, prefersDark: boolean): Theme => {
  if (stored === 'light' || stored === 'dark') return stored
  return prefersDark ? 'dark' : 'light'
}

const read = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(KEY)
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  return resolveInitialTheme(stored, prefersDark)
}

const apply = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
    // Колір статус-бара/адресного рядка на мобільному — у тон фону сторінки,
    // інакше зверху лишається біла смуга, що не збігається з темою.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#18141f' : '#fff3f5')
  }
}

const theme = ref<Theme>(read())

export const useTheme = () => {
  const setTheme = (next: Theme) => {
    theme.value = next
    if (typeof window !== 'undefined') localStorage.setItem(KEY, next)
    apply(next)
  }

  const toggleTheme = () => {
    const next = theme.value === 'dark' ? 'light' : 'dark'
    track('theme-toggle', { theme: next })
    setTheme(next)
  }

  apply(theme.value)

  return { theme, setTheme, toggleTheme }
}
