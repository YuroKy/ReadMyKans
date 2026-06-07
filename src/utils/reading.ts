import { ref } from 'vue'
import type { IpadicFeatures, Tokenizer } from '@sglkc/kuromoji'

// Стан готовності словника читань (реактивний для UI)
export const readingReady = ref(false)
export const readingLoading = ref(false)
export const readingError = ref('')

let tokenizer: Tokenizer<IpadicFeatures> | null = null
let initPromise: Promise<void> | null = null

const katakanaToHiragana = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0)
      // Катакана 0x30A1–0x30F6 → хірагана (зсув на 0x60)
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : char
    })
    .join('')

/**
 * Ініціалізує словник kuromoji (≈15MB, вантажиться один раз).
 * Безпечно викликати багаторазово — повертає той самий проміс.
 */
export const initReading = (): Promise<void> => {
  if (initPromise) return initPromise

  readingLoading.value = true
  // Динамічний імпорт: kuromoji вантажиться лише коли реально потрібен
  // (також не ламає юніт-тести, які не ініціалізують словник).
  initPromise = import('@sglkc/kuromoji')
    .then(
      (kuromoji) =>
        new Promise<void>((resolve) => {
          kuromoji.builder({ dicPath: '/dict' }).build((err, builtTokenizer) => {
            readingLoading.value = false
            if (err) {
              readingError.value = 'Не вдалося завантажити словник читань.'
              // Не реджектимо — застосунок працює і без kuromoji (fallback на сирий текст)
              resolve()
              return
            }
            tokenizer = builtTokenizer
            readingReady.value = true
            resolve()
          })
        }),
    )
    // Якщо сам імпорт kuromoji впав (напр. stale Vite-кеш) — деградуємо м'яко:
    // застосунок працює на сирому тексті, без читання кандзі. Без uncaught-помилки.
    .catch(() => {
      readingLoading.value = false
      readingError.value = 'Словник читань недоступний — працюємо без нього.'
    })

  return initPromise
}

export const isReadingReady = () => tokenizer !== null

/**
 * Перетворює довільний японський текст (кандзі+кана) на читання в хірагані.
 * Якщо словник ще не готовий — повертає вхідний текст без змін (fallback).
 */
export const toReadingHiragana = (text: string): string => {
  if (!tokenizer || !text) return text

  const tokens = tokenizer.tokenize(text)
  return tokens
    .map((token) => {
      // pronunciation (вимова) точніша за reading: частка は→ワ, へ→エ тощо.
      const kana = token.pronunciation && token.pronunciation !== '*'
        ? token.pronunciation
        : token.reading && token.reading !== '*'
          ? token.reading
          : token.surface_form
      return katakanaToHiragana(kana)
    })
    .join('')
}
