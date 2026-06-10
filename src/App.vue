<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FileUploadPanel from './components/FileUploadPanel.vue'
import KanaReferenceTable from './components/KanaReferenceTable.vue'
import KanaDrill from './components/KanaDrill.vue'
import KanaMasteryPanel from './components/KanaMasteryPanel.vue'
import KanaStatsPanel from './components/KanaStatsPanel.vue'
import ReadingSession from './components/ReadingSession.vue'
import ResultReview from './components/ResultReview.vue'
import SakuraDecor from './components/SakuraDecor.vue'
import SessionHistory from './components/SessionHistory.vue'
import TextInputPanel from './components/TextInputPanel.vue'
import TextLibraryPanel from './components/TextLibraryPanel.vue'
import DataPanel from './components/DataPanel.vue'
import DailyGoalPanel from './components/DailyGoalPanel.vue'
import AchievementsPanel from './components/AchievementsPanel.vue'
import ActivityCalendar from './components/ActivityCalendar.vue'
import AccuracyTrend from './components/AccuracyTrend.vue'
import SprintSession from './components/SprintSession.vue'
import MemoryGame from './components/MemoryGame.vue'
import { useSessionHistory } from './composables/useSessionHistory'
import { useTheme } from './composables/useTheme'
import { useStreak } from './composables/useStreak'
import { useGameLock } from './composables/useGameLock'
import { useExamHistory } from './composables/useExamHistory'
import { isoWeek, attemptedThisWeek } from './utils/exam'
import DebtRansomPanel from './components/DebtRansomPanel.vue'
import ExamSession from './components/ExamSession.vue'
import AchievementsPage from './components/AchievementsPage.vue'
import AchievementIcon from './components/AchievementIcon.vue'
import { useDailyProgress } from './composables/useDailyProgress'
import { useAchievements } from './composables/useAchievements'
import { useProgressSnapshot } from './composables/useProgressSnapshot'
import { useToasts } from './composables/useToasts'
import { achievementById } from './utils/achievements'
import { usePwaInstall } from './composables/usePwaInstall'
import { usePwaUpdate } from './composables/usePwaUpdate'
import { useHashRoute } from './composables/useHashRoute'
import type { AppView, SessionResult, UploadedFileInfo } from './types'
import type { LibraryText } from './data/library'
import { analyzeKana } from './utils/kana'
import { track } from './utils/analytics'
import { initReading } from './utils/reading'
import { loadReadingProgress } from './utils/readingProgress'
import { viewForHash } from './utils/route'
import { DEFAULT_STORY } from './data/defaultStory'

void initReading()

const view = ref<AppView>('setup')
const sourceText = ref(DEFAULT_STORY)

// Перезавантаження посеред читання: відновлюємо текст незавершеної сесії,
// щоб диплінк #/reading вижив і ReadingSession продовжила зі збереженого місця.
const savedReading = loadReadingProgress()
if (savedReading && viewForHash(window.location.hash) === 'reading') {
  sourceText.value = savedReading.text
}
const setupError = ref('')
const uploadError = ref('')
const fileInfo = ref<UploadedFileInfo | null>(null)
const latestResult = ref<SessionResult | null>(null)
const { history, addSession, clearHistory } = useSessionHistory()

const { theme, toggleTheme } = useTheme()
const { state: streak, recordActivity, grantFreeze } = useStreak()
// Драматизуємо межі стріку: згорів — траур, врятований заморозкою — полегшення.
const streakBurstKey = ref(0)
const {
  count: dailyCount,
  goal: dailyGoal,
  reached: dailyReached,
  add: dailyAdd,
} = useDailyProgress()
const { sync: syncAchievementsStore } = useAchievements()
const { build: buildSnapshot } = useProgressSnapshot()
const { toasts, push: pushToast, dismiss: dismissToast } = useToasts()
const { locked: gamesAreLocked, debtCount, ransomInProgress } = useGameLock()
const { records: examRecords } = useExamHistory()
const examTakenThisWeek = computed(() => attemptedThisWeek(examRecords.value, isoWeek()))
const { canInstall, promptInstall } = usePwaInstall()
const { needRefresh, refresh } = usePwaUpdate()

// Deep links that need state we don't have fall back to the setup screen.
useHashRoute(view, (target) => {
  if (target === 'result' && !latestResult.value) return 'setup'
  if ((target === 'reading' || target === 'drill') && !sourceText.value.trim()) return 'setup'
  // Борг SRS замикає міні-ігри і через диплінки теж.
  if ((target === 'sprint' || target === 'memory') && gamesAreLocked.value) return 'setup'
  // Екзамен — одна спроба на тиждень, диплінком теж не обійдеш.
  if (target === 'exam' && examTakenThisWeek.value) return 'setup'
  return target
})

const GOAL_TOAST = {
  icon: '🎯',
  title: 'Денну ціль виконано!',
  text: 'Так тримати — стрік у безпеці.',
}

// Reconcile achievements against current progress; celebrate any new unlocks.
const syncAchievements = () => {
  for (const id of syncAchievementsStore(buildSnapshot())) {
    const achievement = achievementById(id)
    if (achievement) {
      track('achievement-unlock', { achievement: id })
      pushToast({
        icon: achievement.icon,
        achievementId: id,
        title: `Досягнення: ${achievement.title}`,
        text: achievement.description,
      })
    }
  }
}

onMounted(() => {
  const advance = recordActivity()
  if (advance.event === 'burned' && advance.lost >= 2) {
    streakBurstKey.value += 1
    pushToast({
      icon: '💔',
      title: `Стрік згорів: −${advance.lost} ${streakWord(advance.lost)}`,
      text: 'Усе спочатку. Заморозки заробляються бездоганними сесіями.',
    })
  } else if (advance.event === 'frozen') {
    pushToast({
      icon: '🧊',
      title: 'Заморозку витрачено',
      text: `Стрік урятовано: ${advance.state.streak} ${streakWord(advance.state.streak)} живе далі.`,
    })
  }
  syncAchievements()
})

const streakWord = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дні'
  return 'днів'
}

const kanaAnalysis = computed(() => analyzeKana(sourceText.value))

const startReading = () => {
  if (!sourceText.value.trim()) {
    setupError.value = 'Додайте японський текст або завантажте .txt файл.'
    return
  }

  setupError.value = ''
  latestResult.value = null
  track('reading-start', {
    kana: kanaAnalysis.value.hiraganaCount + kanaAnalysis.value.katakanaCount,
  })
  view.value = 'reading'
}

const startDrill = () => {
  if (!sourceText.value.trim()) {
    setupError.value = 'Додайте японський текст або завантажте .txt файл.'
    return
  }
  setupError.value = ''
  track('drill-start')
  view.value = 'drill'
}

const lockedGameToast = () =>
  pushToast({
    icon: '🔒',
    title: 'Спершу сплати борг повторень',
    text: `Прострочено ${debtCount.value} кан. Відкуп — на головному екрані.`,
  })

const startSprint = () => {
  if (gamesAreLocked.value) {
    lockedGameToast()
    return
  }
  setupError.value = ''
  view.value = 'sprint'
}

const startMemory = () => {
  if (gamesAreLocked.value) {
    lockedGameToast()
    return
  }
  setupError.value = ''
  view.value = 'memory'
}

const startExam = () => {
  if (examTakenThisWeek.value) {
    pushToast({
      icon: '🗓',
      title: 'Екзамен уже складався цього тижня',
      text: 'Одна спроба на тиждень. Побачимось у понеділок.',
    })
    return
  }
  setupError.value = ''
  view.value = 'exam'
}

const handleLibrarySelect = (entry: LibraryText) => {
  sourceText.value = entry.text
  fileInfo.value = null
  uploadError.value = ''
  setupError.value = ''
  track('library-select', { text: entry.id })
}

const handleFileLoaded = (text: string, info: UploadedFileInfo) => {
  sourceText.value = text
  fileInfo.value = info
  uploadError.value = ''
  setupError.value = ''
  track('file-upload', { chars: [...text].length })
}

const handleSessionFinished = (result: SessionResult) => {
  latestResult.value = result
  addSession(result)
  track('reading-finish', {
    accuracy: Math.round(result.accuracy),
    kana: result.originalLength,
    seconds: Math.round(result.durationMs / 1000),
  })
  // A finished reading session is worth a few cards toward today's goal.
  if (dailyAdd(3)) pushToast(GOAL_TOAST)
  // Бездоганне читання теж заробляє заморозку стріку.
  if (result.accuracy >= 100 && grantFreeze()) {
    pushToast({
      icon: '🧊',
      title: '+1 заморозка стріку',
      text: 'За бездоганне читання. Врятує стрік, якщо пропустиш день.',
    })
  }
  syncAchievements()
  view.value = 'result'
}

const installApp = async () => {
  const accepted = await promptInstall()
  track('pwa-install', { outcome: accepted ? 'accepted' : 'dismissed' })
}

const retryLatest = () => {
  latestResult.value = null
  view.value = 'reading'
}

const editText = () => {
  // Returning from a drill/reading is a good moment to surface new badges.
  syncAchievements()
  view.value = 'setup'
}

const newSession = () => {
  sourceText.value = DEFAULT_STORY
  fileInfo.value = null
  setupError.value = ''
  uploadError.value = ''
  latestResult.value = null
  view.value = 'setup'
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#/" aria-label="Kana Reader" @click.prevent="newSession">
        <span class="brand-mark">か</span>
        <span>Kana Reader</span>
      </a>
      <div class="topbar-actions">
        <span
          v-if="streak.streak > 0"
          :key="streakBurstKey"
          class="streak-badge"
          :class="{ mourning: streakBurstKey > 0 }"
          :title="`Сьогодні активностей: ${streak.todayCount}`"
        >
          🔥 {{ streak.streak }} {{ streakWord(streak.streak) }}
        </span>
        <span
          v-if="streak.freezes > 0"
          class="streak-badge freeze-badge"
          :title="'Заморозки рятують стрік від пропущеного дня'"
        >
          🧊 ×{{ streak.freezes }}
        </span>
        <span
          class="daily-badge"
          :class="{ done: dailyReached }"
          :title="`Денна ціль: ${dailyCount} / ${dailyGoal}`"
        >
          🎯 {{ dailyCount }}/{{ dailyGoal }}
        </span>
        <span class="topbar-note">Тренування читання японської кани</span>
        <button
          v-if="canInstall"
          class="install-button"
          type="button"
          @click="installApp"
        >
          ⬇ Встановити
        </button>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
          @click="toggleTheme"
        >
          {{ theme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </div>
    </header>

    <main v-if="view === 'setup'" class="setup-layout">
      <section class="intro-panel">
        <SakuraDecor density="rich" />
        <div class="intro-copy">
          <p class="eyebrow">Практика вголос</p>
          <h1>Kana Reader</h1>
          <p>
            Вставте японський текст, прочитайте його вголос і отримайте зрозумілий результат із
            каною для повторення.
          </p>
        </div>
        <div class="intro-actions">
          <button class="secondary-button" type="button" @click="startDrill">Тренувати кану</button>
          <button class="primary-button" type="button" @click="startReading">Почати читання</button>
          <button
            class="ghost-button"
            :class="{ 'game-locked': gamesAreLocked }"
            type="button"
            :title="gamesAreLocked ? 'Замкнено: спершу сплати борг повторень' : ''"
            @click="startSprint"
          >
            {{ gamesAreLocked ? '🔒' : '⏱️' }} Спідран
          </button>
          <button
            class="ghost-button"
            :class="{ 'game-locked': gamesAreLocked }"
            type="button"
            :title="gamesAreLocked ? 'Замкнено: спершу сплати борг повторень' : ''"
            @click="startMemory"
          >
            {{ gamesAreLocked ? '🔒' : '🎴' }} Пари
          </button>
          <button
            class="ghost-button"
            :class="{ 'game-locked': examTakenThisWeek }"
            type="button"
            :title="examTakenThisWeek ? 'Уже складався цього тижня' : '50 кан, без підказок, одна спроба на тиждень'"
            @click="startExam"
          >
            🎓 Екзамен
          </button>
        </div>
      </section>

      <DebtRansomPanel v-if="gamesAreLocked || ransomInProgress" />

      <div class="setup-grid">
        <div class="main-column">
          <TextLibraryPanel :current-text="sourceText" @select="handleLibrarySelect" />
          <TextInputPanel v-model="sourceText" :file-info="fileInfo" :error="setupError" />
          <FileUploadPanel
            @loaded="handleFileLoaded"
            @error="(message) => (uploadError = message)"
          />
          <p v-if="uploadError" class="field-error standalone">{{ uploadError }}</p>
        </div>

        <aside class="side-column">
          <KanaStatsPanel :analysis="kanaAnalysis" />
          <DailyGoalPanel />
          <KanaMasteryPanel />
          <AchievementsPanel @open="view = 'achievements'" />
          <ActivityCalendar />
          <KanaReferenceTable />
          <AccuracyTrend :history="history" />
          <SessionHistory :history="history" @clear="clearHistory" />
          <DataPanel />
        </aside>
      </div>
    </main>

    <KanaDrill v-else-if="view === 'drill'" :source-text="sourceText" @exit="editText" />

    <ReadingSession
      v-else-if="view === 'reading'"
      :source-text="sourceText"
      @finish="handleSessionFinished"
      @edit="editText"
    />

    <SprintSession v-else-if="view === 'sprint'" @exit="editText" @finish="syncAchievements" />

    <MemoryGame v-else-if="view === 'memory'" @exit="editText" />

    <ExamSession v-else-if="view === 'exam'" @exit="editText" @finish="syncAchievements" />

    <AchievementsPage v-else-if="view === 'achievements'" @exit="editText" />

    <ResultReview
      v-else-if="latestResult"
      :result="latestResult"
      @retry="retryLatest"
      @edit="editText"
      @new-session="newSession"
    />

    <footer class="site-footer">
      <span>
        © 2026 Yurii Fedelesh · ReadMyKans · риски:
        <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a>
        (CC BY-SA)
      </span>
    </footer>

    <div v-if="needRefresh" class="update-toast" role="status">
      <span>🌸 Доступна нова версія</span>
      <button class="update-toast-action" type="button" @click="refresh">Оновити</button>
    </div>

    <div class="toast-stack" aria-live="polite">
      <div v-for="t in toasts" :key="t.id" class="app-toast" role="status">
        <AchievementIcon
          v-if="t.achievementId"
          :id="t.achievementId"
          :icon="t.icon"
          :unlocked="true"
          :size="36"
        />
        <span v-else class="app-toast-icon" aria-hidden="true">{{ t.icon }}</span>
        <div class="app-toast-body">
          <strong>{{ t.title }}</strong>
          <span v-if="t.text">{{ t.text }}</span>
        </div>
        <button
          class="app-toast-close"
          type="button"
          aria-label="Закрити"
          @click="dismissToast(t.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.daily-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--sky);
  color: var(--sky-strong);
  font-weight: 800;
  font-size: 0.85rem;
  white-space: nowrap;
}

.daily-badge.done {
  background: var(--mint);
  color: var(--mint-strong);
}

.toast-stack {
  position: fixed;
  right: 18px;
  bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 60;
  max-width: min(360px, calc(100vw - 36px));
}

.app-toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--panel);
  box-shadow: var(--shadow);
  border: 1px solid var(--divider);
  animation: toast-in 0.25s ease;
}

.app-toast-icon {
  font-size: 1.5rem;
  line-height: 1.2;
}

.app-toast-body {
  display: grid;
  gap: 2px;
}

.app-toast-body strong {
  color: var(--ink);
  font-size: 0.95rem;
}

.app-toast-body span {
  color: var(--muted);
  font-size: 0.82rem;
}

.app-toast-close {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
