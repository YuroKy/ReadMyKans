// Shared Web Speech (TTS) helper for speaking kana / Japanese text aloud.
// Consolidates the SpeechSynthesis boilerplate that was copy-pasted across the
// drill, the reading session and the shadowing composable: pick a Japanese
// voice, cancel any in-flight utterance, speak. Fails gracefully (returns false)
// when speechSynthesis is unavailable — e.g. in unit tests or older browsers.

export const isSpeechSynthesisSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  'SpeechSynthesisUtterance' in window

export const pickJapaneseVoice = (): SpeechSynthesisVoice | undefined => {
  if (!isSpeechSynthesisSupported()) return undefined
  return window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ja'))
}

export interface SpeakOptions {
  rate?: number
  pitch?: number
}

// Speaks `text` in ja-JP. Returns true if an utterance was queued, false if
// speech synthesis is unavailable or the text is blank.
export const speakKana = (text: string, options: SpeakOptions = {}): boolean => {
  if (!isSpeechSynthesisSupported() || !text.trim()) return false

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = options.rate ?? 0.75
  if (options.pitch !== undefined) utterance.pitch = options.pitch

  const voice = pickJapaneseVoice()
  if (voice) utterance.voice = voice

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
