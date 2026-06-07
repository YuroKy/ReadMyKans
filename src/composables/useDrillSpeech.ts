import type { SpeechRecognitionEventLike, SpeechRecognitionLike } from '../types'

const getCtor = () =>
  (typeof window !== 'undefined' && (window.SpeechRecognition ?? window.webkitSpeechRecognition)) ||
  null

export const isDrillSpeechSupported = (): boolean => Boolean(getCtor())

export interface DrillSpeechSession {
  /** true коли розпізнавання реально стартувало (onstart). */
  started: Promise<boolean>
  /** Зупинити й отримати фінальний текст. */
  stop: () => void
  /** Розпізнаний текст (резолвиться на onend/onerror/watchdog). */
  result: Promise<string>
}

const INERT: DrillSpeechSession = {
  started: Promise.resolve(false),
  stop: () => {},
  result: Promise.resolve(''),
}

// Тримаємо ПОСИЛАННЯ на активний інстанс, щоб коректно прибрати його перед
// новим сеансом (звільнити мікрофон). activeId відсікає «застарілі» події
// від попереднього (вже скасованого) розпізнавача.
let currentRec: SpeechRecognitionLike | null = null
let activeId = 0

const cleanup = (rec: SpeechRecognitionLike) => {
  rec.onstart = null
  rec.onresult = null
  rec.onerror = null
  rec.onend = null
  try {
    rec.abort()
  } catch {
    /* ignore */
  }
}

/**
 * Один сеанс push-to-talk через Web Speech API.
 * Надійний до повторних натискань: перед новим сеансом скасовує попередній
 * розпізнавач (звільняє мікрофон), ігнорує його запізнілі події, і має
 * watchdog на випадок, якщо браузер «зависне» і не дасть onend.
 */
export const startDrillSpeech = (): DrillSpeechSession => {
  const Ctor = getCtor()
  if (!Ctor) return INERT

  // Прибираємо попередній сеанс (звільняє мікрофон/зʼєднання)
  if (currentRec) {
    cleanup(currentRec)
    currentRec = null
  }

  const id = ++activeId
  const rec: SpeechRecognitionLike = new Ctor()
  currentRec = rec
  rec.lang = 'ja-JP'
  rec.continuous = false
  rec.interimResults = true
  rec.maxAlternatives = 1

  let text = ''
  let settled = false
  let watchdog: ReturnType<typeof setTimeout> | null = null

  let resolveStarted!: (v: boolean) => void
  const started = new Promise<boolean>((r) => (resolveStarted = r))
  let resolveResult!: (v: string) => void
  const result = new Promise<string>((r) => (resolveResult = r))

  const isStale = () => id !== activeId

  const finish = () => {
    if (settled || isStale()) return
    settled = true
    if (watchdog) clearTimeout(watchdog)
    resolveStarted(false) // якщо onstart не спрацював
    resolveResult(text)
    if (currentRec === rec) currentRec = null
  }

  rec.onstart = () => {
    if (!isStale()) resolveStarted(true)
  }
  rec.onresult = (event: SpeechRecognitionEventLike) => {
    if (isStale()) return
    let t = ''
    for (let i = 0; i < event.results.length; i += 1) {
      t += event.results[i]?.[0]?.transcript ?? ''
    }
    text = t
  }
  rec.onerror = finish
  rec.onend = finish

  try {
    rec.start()
  } catch {
    finish()
  }

  return {
    started,
    stop: () => {
      try {
        rec.stop()
      } catch {
        finish()
      }
      // Якщо браузер не дасть onend за 2.5с — завершуємо самі
      if (!watchdog && !settled) {
        watchdog = setTimeout(finish, 2500)
      }
    },
    result,
  }
}
