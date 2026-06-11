// «Зникаючий текст» у режимі читання: прочитане блюриться (щоб не можна було
// перечитати), а в режимі «блимання» майбутній текст видно лише поки вікно
// щойно відкрилось — далі кажи з пам'яті.

export type HideMode = 'off' | 'fade' | 'flash' | 'rsvp'
export type CharVisibility = 'visible' | 'blurred' | 'masked'

export const FLASH_WINDOW = 8

// Видимість кани за наскрізним індексом порівнюваних символів. Вікна у
// «блиманні» фіксовані (0..N-1, N..2N-1…): перехід курсора в нове вікно дає
// компоненту сигнал показати його на пару секунд (flashActive).
export const charVisibility = (
  charIndex: number,
  currentIndex: number,
  mode: HideMode,
  windowSize = FLASH_WINDOW,
  flashActive = false,
): CharVisibility => {
  if (mode === 'off') return 'visible'
  if (charIndex < currentIndex) return 'blurred'
  if (mode === 'fade') return 'visible'
  const size = Math.max(1, windowSize)
  // «Фокус» (rsvp): видиме лише ковзне вікно попереду курсора — без блимань.
  if (mode === 'rsvp') return charIndex - currentIndex < size ? 'visible' : 'masked'
  const sameWindow = Math.floor(charIndex / size) === Math.floor(currentIndex / size)
  if (sameWindow) return flashActive ? 'visible' : 'masked'
  return 'masked'
}
