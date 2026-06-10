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
  formatsSeen: string[] // drill formats the learner has tried
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  test: (s: ProgressSnapshot) => boolean
}

const ALL_FORMATS = ['recognition', 'dictation', 'choice', 'writing']

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'cards-100',
    title: 'Сотня карток',
    description: 'Відповісти на 100 карток',
    icon: '💯',
    test: (s) => s.totalAnswered >= 100,
  },
  {
    id: 'cards-500',
    title: 'Пів тисячі',
    description: 'Відповісти на 500 карток',
    icon: '🏯',
    test: (s) => s.totalAnswered >= 500,
  },
  {
    id: 'streak-7',
    title: 'Тиждень поспіль',
    description: '7 днів активності підряд',
    icon: '🔥',
    test: (s) => s.streak >= 7,
  },
  {
    id: 'streak-30',
    title: 'Місяць поспіль',
    description: '30 днів активності підряд',
    icon: '🌕',
    test: (s) => s.streak >= 30,
  },
  {
    id: 'hiragana-master',
    title: 'Володар хіраґани',
    description: 'Засвоїти всю хіраґану',
    icon: 'あ',
    test: (s) => s.hiraganaMasteredPct >= 100,
  },
  {
    id: 'katakana-master',
    title: 'Володар катакани',
    description: 'Засвоїти всю катакану',
    icon: 'ア',
    test: (s) => s.katakanaMasteredPct >= 100,
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
  },
  {
    id: 'suddendeath-15',
    title: 'Сапер',
    description: 'Серія 15+ у раптовій смерті',
    icon: '💀',
    test: (s) => s.bestSuddenDeath >= 15,
  },
  {
    id: 'all-formats',
    title: 'Усебічний',
    description: 'Спробувати всі формати тренування',
    icon: '🎴',
    test: (s) => ALL_FORMATS.every((f) => s.formatsSeen.includes(f)),
  },
]

export const achievementById = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id)

// Ids of every achievement whose condition the snapshot currently satisfies.
export const evaluate = (snapshot: ProgressSnapshot): string[] =>
  ACHIEVEMENTS.filter((a) => a.test(snapshot)).map((a) => a.id)
