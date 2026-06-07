import { kanaCharsEqual } from './romaji'

/**
 * Жадібне підпослідовне зіставлення прочитаної кани з оригіналом.
 *
 * Просуває вказівник по `original`, скануючи `spoken` зліва направо: коли черговий
 * символ spoken збігається з очікуваним original[pointer] — вказівник рухається далі,
 * інакше символ spoken пропускається (вважається шумом/зайвим).
 *
 * Властивості:
 * - монотонність: результат завжди ≥ `from` (прогрес не відкочується назад);
 * - толерантність до сміття: зайві/хибні символи в spoken не блокують прогрес;
 * - стійкість до ковзного вікна ASR: повторні або зміщені часткові результати
 *   не подвоюють і не скидають прогрес (бо стартуємо з уже підтвердженого `from`).
 *
 * @param original кана оригіналу (масив символів)
 * @param spoken   розпізнана кана поточної фрази (масив символів)
 * @param from     уже підтверджена кількість співпадінь (вказівник)
 * @returns нова кількість підтверджених співпадінь (≥ from, ≤ original.length)
 */
export const advanceMatch = (original: string[], spoken: string[], from: number): number => {
  let pointer = Math.max(0, Math.min(from, original.length))

  for (const char of spoken) {
    if (pointer >= original.length) break
    if (kanaCharsEqual(original[pointer]!, char)) {
      pointer += 1
    }
  }

  return pointer
}

export interface MatchDetail {
  /** Нова кількість підтверджених співпадінь (як у advanceMatch). */
  matched: number
  /** Кана, яку користувач щойно вимовив на місці очікуваної, але вона не
   *  збіглася (для підказки «ви назвали»). Порожньо, якщо збіг або тиша. */
  attempt: string
}

/**
 * Як advanceMatch, але додатково повертає «поточну спробу» — перший
 * нерозпізнаний символ spoken одразу після останнього співпадіння. Це та кана,
 * яку користувач вимовив на місці очікуваної (напр. сказав も замість む).
 */
export const matchDetail = (original: string[], spoken: string[], from: number): MatchDetail => {
  let pointer = Math.max(0, Math.min(from, original.length))
  let lastMatchedIndex = -1

  for (let i = 0; i < spoken.length; i += 1) {
    if (pointer >= original.length) break
    if (kanaCharsEqual(original[pointer]!, spoken[i]!)) {
      pointer += 1
      lastMatchedIndex = i
    }
  }

  // Перший символ spoken після останнього співпадіння — поточна (невдала) спроба
  const attempt =
    pointer < original.length && lastMatchedIndex + 1 < spoken.length
      ? spoken[lastMatchedIndex + 1]!
      : ''

  return { matched: pointer, attempt }
}
