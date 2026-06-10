// Achievement catalogue + pure evaluation. The store (useAchievements) feeds a
// progress snapshot here and gets back the set of unlocked ids; nothing in this
// file touches storage or Vue, so it stays trivially testable.

export interface ProgressSnapshot {
  totalAnswered: number
  totalCorrect: number
  bestSessionAccuracy: number // best reading-session accuracy seen, 0..100
  streak: number
  hiraganaMasteredPct: number // 0..100
  katakanaMasteredPct: number // 0..100
  bestSprint: number // best time-attack score
  bestSuddenDeath: number // best sudden-death streak
  bestDrillCombo: number // longest correct streak within a drill session
  formatsSeen: string[] // drill formats the learner has tried
  maxConfusionCount: number // найчастіша одна пара плутанини (для «Зали ганьби»)
  longestHesitationMs: number // найдовше вагання перед відповіддю
}

export interface AchievementProgress {
  current: number
  target: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  test: (s: ProgressSnapshot) => boolean
  // Для лічильних ачивок: прогрес до розлоку (смужка на сторінці досягнень).
  progress?: (s: ProgressSnapshot) => AchievementProgress
  // «Зала ганьби»: антиздобутки, якими не пишаються (окрема секція, попіл).
  shame?: boolean
}

const ALL_FORMATS = ['recognition', 'dictation', 'choice', 'writing']

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'cards-100',
    title: 'Сотня карток',
    description: 'Відповісти на 100 карток',
    icon: '💯',
    test: (s) => s.totalAnswered >= 100,
    progress: (s) => ({ current: Math.min(s.totalAnswered, 100), target: 100 }),
  },
  {
    id: 'cards-500',
    title: 'Пів тисячі',
    description: 'Відповісти на 500 карток',
    icon: '🏯',
    test: (s) => s.totalAnswered >= 500,
    progress: (s) => ({ current: Math.min(s.totalAnswered, 500), target: 500 }),
  },
  {
    id: 'streak-7',
    title: 'Тиждень поспіль',
    description: '7 днів активності підряд',
    icon: '🔥',
    test: (s) => s.streak >= 7,
    progress: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
  },
  {
    id: 'streak-30',
    title: 'Місяць поспіль',
    description: '30 днів активності підряд',
    icon: '🌕',
    test: (s) => s.streak >= 30,
    progress: (s) => ({ current: Math.min(s.streak, 30), target: 30 }),
  },
  {
    id: 'hiragana-master',
    title: 'Володар хіраґани',
    description: 'Засвоїти всю хіраґану',
    icon: 'あ',
    test: (s) => s.hiraganaMasteredPct >= 100,
    progress: (s) => ({ current: Math.round(s.hiraganaMasteredPct), target: 100 }),
  },
  {
    id: 'katakana-master',
    title: 'Володар катакани',
    description: 'Засвоїти всю катакану',
    icon: 'ア',
    test: (s) => s.katakanaMasteredPct >= 100,
    progress: (s) => ({ current: Math.round(s.katakanaMasteredPct), target: 100 }),
  },
  {
    id: 'perfect-session',
    title: 'Бездоганно',
    description: '100% точність у сесії читання',
    icon: '🎯',
    test: (s) => s.bestSessionAccuracy >= 100,
  },
  {
    id: 'sprint-30',
    title: 'Блискавка',
    description: 'Набрати 30+ у спідрані',
    icon: '⚡',
    test: (s) => s.bestSprint >= 30,
    progress: (s) => ({ current: Math.min(s.bestSprint, 30), target: 30 }),
  },
  {
    id: 'combo-20',
    title: 'Серійний',
    description: '20 правильних поспіль у дрилі',
    icon: '🔥',
    test: (s) => s.bestDrillCombo >= 20,
    progress: (s) => ({ current: Math.min(s.bestDrillCombo, 20), target: 20 }),
  },
  {
    id: 'suddendeath-15',
    title: 'Сапер',
    description: 'Серія 15+ у раптовій смерті',
    icon: '💀',
    test: (s) => s.bestSuddenDeath >= 15,
    progress: (s) => ({ current: Math.min(s.bestSuddenDeath, 15), target: 15 }),
  },
  {
    id: 'all-formats',
    title: 'Усебічний',
    description: 'Спробувати всі формати тренування',
    icon: '🎴',
    test: (s) => ALL_FORMATS.every((f) => s.formatsSeen.includes(f)),
  },
  {
    id: 'shame-again-you',
    title: 'Знову ти',
    description: 'Сплутати ту саму пару кан 10 разів',
    icon: '🔁',
    shame: true,
    test: (s) => s.maxConfusionCount >= 10,
    progress: (s) => ({ current: Math.min(s.maxConfusionCount, 10), target: 10 }),
  },
  {
    id: 'shame-six-seconds',
    title: 'Шість секунд ганьби',
    description: 'Думати над карткою 6+ секунд (без таймера, звісно)',
    icon: '🐌',
    shame: true,
    test: (s) => s.longestHesitationMs >= 6000,
  },
]

export const achievementById = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id)

// Ids of every achievement whose condition the snapshot currently satisfies.
export const evaluate = (snapshot: ProgressSnapshot): string[] =>
  ACHIEVEMENTS.filter((a) => a.test(snapshot)).map((a) => a.id)
