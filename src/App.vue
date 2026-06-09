<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import FileUploadPanel from './components/FileUploadPanel.vue'
import KanaReferenceTable from './components/KanaReferenceTable.vue'
import KanaDrill from './components/KanaDrill.vue'
import KanaStatsPanel from './components/KanaStatsPanel.vue'
import ReadingSession from './components/ReadingSession.vue'
import ResultReview from './components/ResultReview.vue'
import SakuraDecor from './components/SakuraDecor.vue'
import SessionHistory from './components/SessionHistory.vue'
import TextInputPanel from './components/TextInputPanel.vue'
import DataPanel from './components/DataPanel.vue'
import { useSessionHistory } from './composables/useSessionHistory'
import { useTheme } from './composables/useTheme'
import { useStreak } from './composables/useStreak'
import type { AppView, SessionResult, UploadedFileInfo } from './types'
import { analyzeKana } from './utils/kana'
import { initReading } from './utils/reading'
import { DEFAULT_STORY } from './data/defaultStory'

void initReading()

const view = ref<AppView>('setup')
const sourceText = ref(DEFAULT_STORY)
const setupError = ref('')
const uploadError = ref('')
const fileInfo = ref<UploadedFileInfo | null>(null)
const latestResult = ref<SessionResult | null>(null)
const { history, addSession, clearHistory } = useSessionHistory()

const { theme, toggleTheme } = useTheme()
const { state: streak, recordActivity } = useStreak()
onMounted(recordActivity)

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
  view.value = 'reading'
}

const startDrill = () => {
  if (!sourceText.value.trim()) {
    setupError.value = 'Додайте японський текст або завантажте .txt файл.'
    return
  }
  setupError.value = ''
  view.value = 'drill'
}

const handleFileLoaded = (text: string, info: UploadedFileInfo) => {
  sourceText.value = text
  fileInfo.value = info
  uploadError.value = ''
  setupError.value = ''
}

const handleSessionFinished = (result: SessionResult) => {
  latestResult.value = result
  addSession(result)
  view.value = 'result'
}

const retryLatest = () => {
  latestResult.value = null
  view.value = 'reading'
}

const editText = () => {
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
      <a class="brand" href="#" aria-label="Kana Reader" @click.prevent="newSession">
        <span class="brand-mark">か</span>
        <span>Kana Reader</span>
      </a>
      <div class="topbar-actions">
        <span
          v-if="streak.streak > 0"
          class="streak-badge"
          :title="`Сьогодні активностей: ${streak.todayCount}`"
        >
          🔥 {{ streak.streak }} {{ streakWord(streak.streak) }}
        </span>
        <span class="topbar-note">Тренування читання японської кани</span>
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
        </div>
      </section>

      <div class="setup-grid">
        <div class="main-column">
          <TextInputPanel v-model="sourceText" :file-info="fileInfo" :error="setupError" />
          <FileUploadPanel
            @loaded="handleFileLoaded"
            @error="(message) => (uploadError = message)"
          />
          <p v-if="uploadError" class="field-error standalone">{{ uploadError }}</p>
        </div>

        <aside class="side-column">
          <KanaStatsPanel :analysis="kanaAnalysis" />
          <KanaReferenceTable />
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

    <ResultReview
      v-else-if="latestResult"
      :result="latestResult"
      @retry="retryLatest"
      @edit="editText"
      @new-session="newSession"
    />

    <footer class="site-footer">
      <span>© 2026 Yurii Fedelesh · ReadMyKans</span>
      <span class="footer-sep" aria-hidden="true">·</span>
      <a
        href="https://github.com/YuroKy/ReadMyKans"
        target="_blank"
        rel="noopener noreferrer"
      >
        Вихідний код (AGPL-3.0)
      </a>
    </footer>
  </div>
</template>
