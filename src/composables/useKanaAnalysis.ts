import { computed, type Ref } from 'vue'
import { analyzeKana } from '../utils/kana'

export const useKanaAnalysis = (text: Ref<string>) => {
  const kanaAnalysis = computed(() => analyzeKana(text.value))
  const kanaCount = computed(
    () => kanaAnalysis.value.hiraganaCount + kanaAnalysis.value.katakanaCount,
  )

  return {
    kanaAnalysis,
    kanaCount,
  }
}
