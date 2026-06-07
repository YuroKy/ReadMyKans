import { ref } from 'vue'

export type AsrEnginePreference = 'auto' | 'server' | 'browser'

const PREF_KEY = 'kana-asr-engine'

// Локальний sherpa-сервер наразі прибраний з UI — застосунок працює через
// Web Speech API. Код сервера лишається в репозиторії; щоб увімкнути знову —
// повернути <AsrSourcePanel /> у setup і змінити дефолт на 'auto'.
const enginePreference = ref<AsrEnginePreference>('browser')

export const useAsrPreference = () => {
  const setPreference = (pref: AsrEnginePreference) => {
    enginePreference.value = pref
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREF_KEY, pref)
    }
  }

  return { enginePreference, setPreference }
}
