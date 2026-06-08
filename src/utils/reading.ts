import { ref } from 'vue'
import type { IpadicFeatures, Tokenizer } from '@sglkc/kuromoji'

export const readingReady = ref(false)
export const readingLoading = ref(false)
export const readingError = ref('')

let tokenizer: Tokenizer<IpadicFeatures> | null = null
let initPromise: Promise<void> | null = null

const katakanaToHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0)

      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
    })
    .join('')

export const initReading = (): Promise<void> => {
  if (initPromise) return initPromise

  readingLoading.value = true

  initPromise = import('@sglkc/kuromoji')
    .then(
      (kuromoji) =>
        new Promise<void>((resolve) => {
          const dicPath = `${import.meta.env.BASE_URL}dict`.replace(/\/\//g, '/')
          kuromoji.builder({ dicPath }).build((err, builtTokenizer) => {
            readingLoading.value = false
            if (err) {
              readingError.value = 'Не вдалося завантажити словник читань.'

              resolve()
              return
            }
            tokenizer = builtTokenizer
            readingReady.value = true
            resolve()
          })
        }),
    )

    .catch(() => {
      readingLoading.value = false
      readingError.value = 'Словник читань недоступний — працюємо без нього.'
    })

  return initPromise
}

export const isReadingReady = () => tokenizer !== null

export const toReadingHiragana = (text: string): string => {
  if (!tokenizer || !text) return text

  const tokens = tokenizer.tokenize(text)
  return tokens
    .map((token) => {
      const kana =
        token.pronunciation && token.pronunciation !== '*'
          ? token.pronunciation
          : token.reading && token.reading !== '*'
            ? token.reading
            : token.surface_form
      return katakanaToHiragana(kana)
    })
    .join('')
}
