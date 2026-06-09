import { computed, getCurrentInstance, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { splitSentences } from '../utils/sentences'

// «Слухай і повторюй»: speaks the source text aloud (ja-JP) so the learner has a
// pronunciation model to shadow. Supports both whole-text playback and
// sentence-by-sentence pacing (play one sentence, repeat it, advance manually).
// Falls back gracefully when speechSynthesis is unavailable (e.g. in unit tests
// / unsupported browsers).
export const useShadowing = (text: Ref<string>) => {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  const isPlaying = ref(false)
  const rate = ref(0.9)

  const segments = computed(() => splitSentences(text.value))
  const currentIndex = ref(0)
  const currentSegment = computed(() => segments.value[currentIndex.value] ?? '')
  const hasSegments = computed(() => segments.value.length > 0)

  // Keep the cursor inside the (possibly changed) segment list.
  watch(segments, (list) => {
    if (currentIndex.value > list.length - 1) currentIndex.value = Math.max(0, list.length - 1)
  })

  const pickJapaneseVoice = () =>
    window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ja'))

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    isPlaying.value = false
  }

  const speak = (content: string) => {
    if (!supported || !content.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
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

  // Whole-text playback (kept for backward compatibility with existing UI).
  const play = () => speak(text.value)
  const toggle = () => (isPlaying.value ? stop() : play())

  // Sentence-by-sentence controls.
  const playSegment = (index: number) => {
    const content = segments.value[index]
    if (content === undefined) return
    currentIndex.value = index
    speak(content)
  }
  const playCurrent = () => playSegment(currentIndex.value)
  const repeat = () => playCurrent()
  const next = () => {
    if (currentIndex.value < segments.value.length - 1) playSegment(currentIndex.value + 1)
  }
  const prev = () => {
    if (currentIndex.value > 0) playSegment(currentIndex.value - 1)
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(stop)
  }

  return {
    supported,
    isPlaying,
    rate,
    play,
    stop,
    toggle,
    segments,
    currentIndex,
    currentSegment,
    hasSegments,
    playSegment,
    playCurrent,
    repeat,
    next,
    prev,
  }
}
