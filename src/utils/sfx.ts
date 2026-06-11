// Короткі ігрові звуки, синтезовані Web Audio API — без аудіофайлів.
// Чиста частина (ноти + резолв налаштування) винесена сюди й покрита тестами;
// відтворення і стан тумблера живуть у composables/useSfx.ts.

export type SfxName = 'correct' | 'wrong' | 'combo' | 'fanfare' | 'finish'

export interface SfxNote {
  /** Частота, Гц */
  freq: number
  /** Зсув старту від початку ефекту, с */
  at: number
  /** Тривалість ноти, с */
  dur: number
  type?: OscillatorType
  /** Пікова гучність (0..1) */
  gain?: number
}

// Збережене 'off' вимикає звук; будь-що інше (включно з відсутністю) — увімкнено.
export const resolveSfxEnabled = (stored: string | null): boolean => stored !== 'off'

// Нотки підібрані на слух: «правильно» — короткий мажорний стрибок угору,
// «помилка» — мʼякий низький бззз, «комбо згоріло» — драматичний спуск,
// «фанфари» — арпеджіо для ачивок/цілі, «фініш» — спокійна тріада.
export const SFX_NOTES: Record<SfxName, SfxNote[]> = {
  correct: [
    { freq: 659.25, at: 0, dur: 0.09 },
    { freq: 880, at: 0.08, dur: 0.16 },
  ],
  wrong: [
    { freq: 196, at: 0, dur: 0.16, type: 'triangle', gain: 0.09 },
    { freq: 155.56, at: 0.11, dur: 0.22, type: 'triangle', gain: 0.09 },
  ],
  combo: [
    { freq: 523.25, at: 0, dur: 0.1, type: 'sawtooth', gain: 0.05 },
    { freq: 392, at: 0.1, dur: 0.1, type: 'sawtooth', gain: 0.05 },
    { freq: 311.13, at: 0.2, dur: 0.24, type: 'sawtooth', gain: 0.05 },
  ],
  fanfare: [
    { freq: 523.25, at: 0, dur: 0.11 },
    { freq: 659.25, at: 0.1, dur: 0.11 },
    { freq: 783.99, at: 0.2, dur: 0.11 },
    { freq: 1046.5, at: 0.3, dur: 0.28 },
  ],
  finish: [
    { freq: 392, at: 0, dur: 0.14 },
    { freq: 523.25, at: 0.12, dur: 0.14 },
    { freq: 659.25, at: 0.24, dur: 0.3 },
  ],
}
