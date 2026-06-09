import { getCurrentInstance, onBeforeUnmount, ref, type Ref } from 'vue'

// «Слухай і повторюй»: speaks the source text aloud (ja-JP) so the learner has a
// pronunciation model to shadow. Falls back gracefully when speechSynthesis is
// unavailable (e.g. in unit tests / unsupported browsers).
export const useShadowing = (text: Ref<string>) => {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  const isPlaying = ref(false)
  const rate = ref(0.9)

  const pickJapaneseVoice = () =>
    window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ja'))

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    isPlaying.value = false
  }

  const play = () => {
    if (!supported || !text.value.trim()) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text.value)
    utterance.lang = 'ja-JP'
    utterance.rate = rate.value
    const voice = pickJapaneseVoice()
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      isPlaying.value = false
    }
    utterance.onerror = () => {
      isPlaying.value = false
    }
    window.speechSynthesis.speak(utterance)
    isPlaying.value = true
  }

  const toggle = () => (isPlaying.value ? stop() : play())

  if (getCurrentInstance()) {
    onBeforeUnmount(stop)
  }

  return { supported, isPlaying, rate, play, stop, toggle }
}
