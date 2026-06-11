import { computed, ref, watch } from 'vue'
import { parseCustomVocab } from '../utils/customVocab'
import { setCustomWords } from '../data/wordSources'

// Власний словник користувача: сирий текст «かな = переклад» у localStorage,
// розпарсені слова реєструються у wordSources (переклади у фідбеку карток).
// Singleton-стейт — джерело дрила і редактор бачать одне й те саме.

const KEY = 'kana-custom-vocab'

const read = (): string => {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

const rawText = ref(read())

const parsed = computed(() => parseCustomVocab(rawText.value))

watch(
  parsed,
  (value) => setCustomWords(value.entries),
  { immediate: true },
)

watch(rawText, (value) => {
  if (typeof window !== 'undefined') localStorage.setItem(KEY, value)
})

export const useCustomVocab = () => ({
  rawText,
  entries: computed(() => parsed.value.entries),
  errors: computed(() => parsed.value.errors),
})
