import { ref, watch } from 'vue'

// Hardcore-режими дрила: один persisted-обʼєкт для всіх тумблерів, щоб не
// плодити окремі ключі localStorage на кожну опцію.

export type DrillTimerSetting = 'off' | '5' | '3'

export interface DrillPrefs {
  timer: DrillTimerSetting
  writingBlind: boolean
  dictationHardcore: boolean
  dictationRate: 1 | 1.25
  // Ввід відповіді в диктанті: ромадзі з фізичної клавіатури чи кана з екранної.
  dictationInput: 'romaji' | 'kana'
  growing: boolean
}

const KEY = 'kana-drill-prefs'

export const defaultPrefs = (): DrillPrefs => ({
  timer: 'off',
  writingBlind: false,
  dictationHardcore: false,
  dictationRate: 1,
  dictationInput: 'romaji',
  growing: false,
})

const read = (): DrillPrefs => {
  if (typeof window === 'undefined') return defaultPrefs()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultPrefs()
    return { ...defaultPrefs(), ...(JSON.parse(raw) as Partial<DrillPrefs>) }
  } catch {
    return defaultPrefs()
  }
}

const prefs = ref<DrillPrefs>(read())

watch(
  prefs,
  (value) => {
    if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(value))
  },
  { deep: true },
)

export const useDrillPrefs = () => ({ prefs })
