# ReadMyKans — Agent Guide

## Project Overview

**Kana Reader** — браузерна SPA для тренування читання японської кани (хірагана/катакана).
Два режими: **дрил** (картка за карткою, голос або ввід ромадзі) і **читання** (неперервне читання тексту вголос). Розпізнавання — через **Web Speech API** браузера.

**UI мова**: Українська. **Цільова мова**: Японська. **Бекенду немає** — усе в браузері.

---

## Tech Stack

| Шар | Технологія |
|-----|-----------|
| Frontend | Vue 3 (Composition API) + TypeScript + Vite (rolldown-vite 8) |
| Розпізнавання мови | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `ja-JP`) |
| Кандзі → кана | `@sglkc/kuromoji` (лениве завантаження словника) |
| Стилі | Чистий CSS (`src/styles/base.css`) |
| Стан | Vue composables + localStorage |
| Тести | `node:test` + `tsx` |
| CI/CD | GitHub Actions → GitHub Pages |

> ⚠️ Колишній локальний sherpa-onnx ASR-сервер **видалено**. Розпізнавання лише браузерне.

---

## Directory Structure

```
ReadMyKans/
├── src/
│   ├── components/
│   │   ├── KanaDrill.vue        # Режим дрила (картки кани)
│   │   ├── ReadingSession.vue   # Режим неперервного читання
│   │   ├── ResultReview.vue     # Підсумок сесії читання
│   │   ├── TextInputPanel.vue / FileUploadPanel.vue
│   │   ├── KanaStatsPanel.vue / KanaReferenceTable.vue
│   │   ├── MicrophoneStatus.vue / SessionHistory.vue
│   ├── composables/
│   │   ├── useKanaDrill.ts      # Стан дрила: чанки, прогрес, submit
│   │   ├── useDrillSpeech.ts    # Push-to-talk через Web Speech (1 інстанс)
│   │   ├── usePushToTalk.ts     # Стейт-машина «тримай і кажи»
│   │   ├── useSpeechRecognition.ts  # Web Speech wrapper (режим читання)
│   │   ├── useTextComparison.ts # compareTexts (Levenshtein + читання)
│   │   ├── useSessionHistory.ts # localStorage сесії
│   │   └── useKanaAnalysis.ts
│   ├── utils/
│   │   ├── matching.ts          # advanceMatch / matchDetail (живий матчинг)
│   │   ├── chunking.ts          # chunkKana, checkRomajiAnswer, checkKanaAnswer
│   │   ├── reading.ts           # kuromoji: toReadingHiragana (кандзі→кана)
│   │   ├── kana.ts / romaji.ts / levenshtein.ts / textNormalize.ts
│   ├── data/defaultStory.ts     # Дефолтний текст (казка かぐやひめ)
│   ├── App.vue                  # Root: view = setup | drill | reading | result
│   └── main.ts
│   └── **/*.test.ts             # Тести (node:test), виключені з прод-збірки
│
├── scripts/copy-dict.mjs        # Копіює словник kuromoji у public/dict (postinstall)
├── public/dict/                 # (git-ignored) словник kuromoji *.dat.gz
├── .github/workflows/deploy.yml # CI/CD: test → build → Pages
├── vite.config.ts               # base /ReadMyKans/ для прод; serveDictRaw плагін
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

---

## Key Concepts

### App Views (App.vue)
`setup` → (`drill` | `reading` → `result`). Дефолтний текст — `DEFAULT_STORY`.
- **Hash-роутинг**: `view` синхронізується з `location.hash` (`utils/route.ts` + `useHashRoute`) — диплінки `#/drill` тощо, кнопка «назад» повертає на setup. Диплінк без потрібного стану (`#/result` без результату, дрил без тексту) редіректить на setup через `resolve`-колбек.
- **Бібліотека текстів** (`data/library.ts` + `TextLibraryPanel.vue`): градуйовані готові тексти на setup-екрані; вибір сетить `sourceText`. Тексти — кана з повноширинними пробілами (чанкінг ріже по словах).

### Дрил (KanaDrill) — дві осі: **джерело × формат**
- **Джерело** (`drillMode` + `useDrillSource`): _які_ кани — весь текст / SRS на сьогодні / слабкі / плутанини / словник N5 / набори.
- **Словник N5** (`data/vocabulary.ts`, режим `vocab`): слова чистою каною з укр. перекладом; джерело віддає їх через повноширинний пробіл (першими — слова з найтерміновішою каною), дека форсує чанк «ціле слово» (`isWordMode`), картки recognition/dictation показують `currentTranslation` у фідбеку. `translationFor` індексує і катакана-, і хіраґана-форму (kuromoji зводить читання до хіраґани). Слово-рівневі результати **не** пишуться у `kana-stats` (інакше слова зламали б режим «слабкі»).
- **SRS — один модуль `utils/srs.ts`**: Leitner-розклад (`kana-srs`: `nextCard`/`dueKana`, живить режим «на сьогодні») + комбінований `reviewPriority(stat, card, today)` — прострочені за розкладом (100+) → слабкі за `kana-stats` (0..15, нові=3) → заплановані на майбутнє «відпочивають» (≤2). `orderBySrs(kana, stats, schedule, today)` сортує всі цільові джерела дрила. Сховища `kana-stats` і `kana-srs` окремі — зберігають різне (точність/плутанини vs розклад).
- **Формат** (`useDrillDeck.format`, persisted): _як_ перевіряти. Спільний стан (навігація, stats/SRS, підсумок) — у **`useDrillDeck`**; формати — тонкі компоненти, що отримують `deck` пропом і кличуть `answer*`/`skip`/`restart`:
  - `recognition` → `DrillRecognitionCard` (бачиш кану → ромадзі `answerRomaji` / голос `answerVoice`)
  - `dictation` → `DrillDictationCard` (TTS `speakKana` → ввід ромадзі)
  - `choice` → `DrillChoiceCard` (ромадзі/звук → 4 плитки з `buildDistractors`; хибний тап → `confusedWith` + контраст)
  - `writing` → `DrillWritingCard` (обведення на canvas; оцінка через `strokeMatch` покриттям гліфа, **не** порядком рисок). Підказка порядку рисок — `StrokeOrderHint.vue` поверх полотна (кнопка + автопоказ після помилки): дані `data/kanaStrokes.ts` **згенеровано** `scripts/build-strokes.mjs` із KanjiVG (CC BY-SA, атрибуція у футері), вантажаться ледачим `import()`; якщо гліфа немає — кнопка ховається.
- `choice`/`writing` — завжди single-kana (`effectiveChunkSize=1`). Письмо/вибір фіксують результат через `answerKana`/`answerWritten` (→ `useKanaDrill.submitOutcome`).
- `useKanaDrill(sourceText, chunkSize)` → ріже читання джерела на шматки по `chunkSize` кан.
- `submitKana` пробує СИРИЙ текст і читання (kuromoji) — бо kuromoji вважає ізольовану は часткою → わ (хибна помилка), тому сире は теж приймається.
- Push-to-talk: `usePushToTalk` (стейт-машина) + `useDrillSpeech` (Web Speech, **один інстанс**, що перевикористовується; скасування попереднього сеансу + watchdog).
- TTS у дрилі/читанні — спільний `utils/kanaSpeech.ts` (`speakKana`), graceful без `speechSynthesis`.

### Прогрес читання (utils/readingProgress.ts)
- Незавершена сесія читання зберігається в `kana-reading-progress` (текст + `confirmedLen` + тривалість): пишеться на кожному збігу і кожні ~5 с, чиститься у «Спочатку»/«Завершити». Після перезавантаження на `#/reading` App відновлює текст, а `ReadingSession` — позицію й таймер.
- Дрил: `deck.skip(count)` пропускає кілька карток (кнопки ×3/×5/×10 у всіх форматах); у recognition/dictation пропуск **не** повертає фокус в інпут (на мобільному це піднімало клавіатуру), а «Далі» після помилки — повертає.

### Матчинг (utils/matching.ts)
- `advanceMatch(original, spoken, from)` — жадібне підпослідовне зіставлення; монотонне, толерантне до сміття, стійке до ковзного вікна ASR.
- `matchDetail` — додатково повертає «поточну спробу» для підказки «ви назвали».

### Читання (utils/reading.ts)
- `toReadingHiragana(text)` через kuromoji; якщо словник не завантажений — повертає вхід (graceful).
- `dicPath` враховує `import.meta.env.BASE_URL` (на Pages — `/ReadMyKans/dict`).
- `initReading()` лениво вантажить словник; падіння **не ламає** застосунок.

### Порівняння (useTextComparison)
`compareTexts` → нормалізація читання + романі-толерантний Levenshtein; повертає точність, сегменти, кану для повторення.

### Гейміфікація
- **Денна ціль** (`useDailyProgress`, ключ `kana-daily`): лічильник реальних відповідей за день + ціль. `add(n)` повертає `true`, коли щойно перетнули ціль (один тост). Незалежна від стріку. Хук — `useDrillDeck.handleOutcome` + `App.handleSessionFinished` + ігри.
- **Ачивки** (`utils/achievements.ts` — каталог + `evaluate(snapshot)`; `useAchievements.sync()` — diff проти `kana-achievements`). `useProgressSnapshot.build()` збирає снапшот зі stores. `App.syncAchievements()` кличеться на межах сесій/ігор/mount і тостить нові. Повний каталог — сторінка `#/achievements` (`AchievementsPage.vue`, прогрес через опційне `progress?(s)`); на setup — лише тизер. Іконки — SVG-медальйони `AchievementIcon.vue` (гліфи за id, emoji-фолбек для нових; `Toast.achievementId` рендерить медальйон у тості). Анти-ачивки з `shame: true` («Зала ганьби», попелястий варіант) живляться `maxConfusionCount` і `longestHesitationMs` (max-вагання пише deck у `drill:hesitation`, ігноруючи 60с+ і таймаути).
- **Спідран** (view `sprint`, `useSprint` + `utils/sprint.ts`): 60 с, нескінченна випадкова подача, рахунок=правильні, рекорд у `useBestScores` (`sprint:overall`). Режим **«раптова смерть»** (`SprintMode`): без таймера, перша помилка завершує ран, окремий ключ `sprint:suddendeath` (НЕ рахується в `bestSprint` снапшота — `bestSuddenDeath` окремо).
- **Пари** (view `memory`, `utils/memoryGame.ts` + `MemoryGame.vue`): хіра↔ката / кана↔ромадзі, рекорд за ходами (`recordLow`).
- **Тости** — спільний `useToasts` (singleton-черга), хост у `App.vue`. Усі нові ключі localStorage додані в `useDataTransfer.KEYS`.

### Хардкор-режими
- **`useDrillPrefs`** (ключ `kana-drill-prefs`) — один обʼєкт усіх тумблерів дрила: `timer` ('off'|'5'|'3'), `writingBlind`, `dictationHardcore`, `dictationRate`, `growing`.
- **Таймер на картку** (recognition/dictation): логіка в `useDrillDeck` (`armTimer`/`timeoutCard`), бюджет × довжина чанка, скасування щойно `lastOutcome` ≠ null (гард проти 800мс авто-переходу), таймаут іде звичайним wrong-шляхом (`⏱`). UI — `DrillTimerBar.vue` (CSS-анімація, рестарт через `:key=generation`).
- **Комбо** в дрилі: `combo`/`comboBurst` у deck; згоряння ≥5 — тост + shake; рекорд `drill:combo` → ачивка `combo-20`.
- **Blind-письмо**: `writingBlind` у `DrillWritingCard` — TTS-промпт, полотно без контуру, мʼякші пороги `passesTrace(0.5/0.5)`; без TTS — фолбек на ромадзі-промпт.
- **Хардкор-диктант**: 1 прослуховування (автоплей і є воно), без «Показати кану», `tryAgain` без переграшу, опційний rate ×1.25.
- **Зростаючий чанк**: `takeChunk(words, offset, size)` у chunking.ts; `useKanaDrill(growing)` веде `doneKana`/`growSize` (correct → +1, помилка/пропуск → 1); точність деки в цьому режимі — від `answeredCount`, не `total`. Рекорд `drill:grow`.
- **Джерело «Кат»** (`executioner` у `useDrillSource`): плутанини + кластери `utils/minimalPairs.ts` (`clusterFor`); холодний фолбек — усі кани кластерів; у choice дистрактори з того ж кластера.
- **Зникаючий текст читання** (`utils/readingFocus.ts`, ключ `kana-reading-hide`): `fade` блюрить прочитане, `flash` показує 8-канне вікно на 2 с і маскує (тікер `now` реюзається). Пунктуація завжди видима.
- **Стрік зі ставкою** (`useStreak`): `advanceStreak` повертає `{ state, event, lost }` (extended/frozen/burned); заморозки (cap 2) заробляються бездоганною сесією (дрил ≥10 карток / читання 100%) і гасять пропущені дні; burned — траурний тост + shake бейджа.
- **SRS-борг** (`utils/debt.ts` + `useGameLock`, ключ `kana-ransom`): борг = лише **прострочені заплановані** картки (`overdueKana`, НЕ `dueKana` — інакше новачок залочений). ≥20 — спринт/пари замкнено (кнопки + диплінк-veto в resolve). Відкуп — `DebtRansomPanel` (міні-дрил 10 кан на `useKanaDrill` напряму, БЕЗ useDrillDeck), 10/10 → розлок до кінця дня; `ransomInProgress` тримає панель змонтованою, поки борг гаситься відповідями.
- **Тижневий екзамен** (view `exam`, `utils/exam.ts` + `ExamSession.vue` + `useExamHistory` `kana-exam`): 50 SRS-зважених білетів recognition/dictation/choice впереміш, без підказок/пропусків, 1 спроба на ISO-тиждень (`isoWeek`, veto диплінка), поріг 90%, спарклайн історії на trend.ts. НЕ на useDrillDeck (persisted-формат + вшиті retry/skip).

### Аналітика
- **Хітмапа активності** (`useActivityLog` — `kana-activity` date→count, бампиться з `useDailyProgress.add`; `utils/calendar.ts` — `buildCalendar` сітка тижнів; `ActivityCalendar.vue`).
- **Графік точності** (`utils/trend.ts` — `sparkline`/`polyline`/`areaPath`; `AccuracyTrend.vue` бере `history` пропом, рендерить SVG-спарклайн точності читань).

---

## Тести й CI

```bash
npm run lint      # ESLint (flat config eslint.config.js: typescript-eslint + eslint-plugin-vue flat/recommended)
npm test          # node:test + tsx, src/**/*.test.ts
npm run test:e2e  # Playwright-смоук (e2e/smoke.spec.ts), сам піднімає dev-сервер
npm run build     # vue-tsc -b && vite build (тест-файли виключені з tsconfig.app)
npm run dev / preview
```

- CI (`.github/workflows/deploy.yml`): `npm install` → `npm run lint` → `npm test` → Playwright-смоук → `npm run build` → deploy на Pages. Деплой лише якщо тести пройшли.
- **ESLint**: навмисні відхилення задокументовані в `eslint.config.js` — повноширинні пробіли в японських текстах (`no-irregular-whitespace` зі skip-опціями), порожні `catch` (graceful degradation), вимкнені суто форматувальні vue-правила (`max-attributes-per-line`, `singleline-html-element-content-newline`).
- **E2e** (`e2e/smoke.spec.ts`): setup, бібліотека, дрил із ромадзі, роутинг. Без голосу — Web Speech у headless недоступний. Правильну відповідь тест бере з кнопки «Показати підказку», а не дублює транслітерацію.
- **Тест-файли виключені** з `tsconfig.app.json` (`exclude: ["src/**/*.test.ts"]`), бо імпортують `node:test`.

---

## Architecture Notes for Agents

- **Немає бекенду / сервера / sherpa** — лише браузер. Не додавай серверних залежностей без потреби.
- **Чисту логіку виноси в `utils/` і покривай тестами** (`*.test.ts` поруч). Композабли стану (useKanaDrill, usePushToTalk) теж тестовані з vue-рефами в node.
- **kuromoji** імпортується ДИНАМІЧНО в `reading.ts` (`import('@sglkc/kuromoji')`) — щоб не ламати юніт-тести й код-спліт. Не роби статичний імпорт.
- **Словник** (`public/dict`) git-ignored, копіюється `postinstall` (`scripts/copy-dict.mjs`).
- **GitHub Pages**: `base: '/ReadMyKans/'` лише для `build`; шляхи до ресурсів через `BASE_URL`.
- При зміні логіки матчингу/порівняння — спочатку тест (`npm test`), він швидший за ручну перевірку голосом.
- Web Speech слабкий на **ізольованій кані** — у дрилі завжди є надійний резерв (ввід ромадзі).
```
