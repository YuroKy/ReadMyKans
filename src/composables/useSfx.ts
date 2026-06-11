import { ref } from 'vue'
import { SFX_NOTES, resolveSfxEnabled, type SfxName } from '../utils/sfx'

const KEY = 'kana-sfx'

const enabled = ref(
  typeof window === 'undefined' ? true : resolveSfxEnabled(localStorage.getItem(KEY)),
)

// Один AudioContext на застосунок, створюється ліниво при першому звуці
// (перший виклик завжди йде з жесту користувача — політики автоплею ситі).
let ctx: AudioContext | null = null
const audioContext = (): AudioContext | null => {
  if (ctx) return ctx
  try {
    const Ctor =
      window.AudioContext ??
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  } catch {
    return null
  }
  return ctx
}

// Синглтон-стан (як useToasts): тумблер у топбарі й програвачі у деці/іграх
// ділять один ref. Звук — прикраса, тому будь-який збій Web Audio мовчки ковтається.
export const useSfx = () => {
  const play = (name: SfxName) => {
    if (!enabled.value || typeof window === 'undefined') return
    const ac = audioContext()
    if (!ac) return
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    const now = ac.currentTime
    for (const note of SFX_NOTES[name]) {
      try {
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.type = note.type ?? 'sine'
        osc.frequency.value = note.freq
        const peak = note.gain ?? 0.07
        gain.gain.setValueAtTime(0.0001, now + note.at)
        gain.gain.exponentialRampToValueAtTime(peak, now + note.at + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur)
        osc.connect(gain).connect(ac.destination)
        osc.start(now + note.at)
        osc.stop(now + note.at + note.dur + 0.03)
      } catch {}
    }
  }

  const toggle = () => {
    enabled.value = !enabled.value
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEY, enabled.value ? 'on' : 'off')
    }
  }

  return { enabled, toggle, play }
}
