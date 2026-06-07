# ReadMyKans — Agent Guide

## Project Overview

**Kana Reader** — SPA для тренування вимови японської кани (хірагана/катакана).
Користувач вводить японський текст або завантажує `.txt` файл, читає вголос, а застосунок порівнює вимову з оригіналом і показує точність.

**UI мова**: Українська. **Цільова мова**: Японська.

---

## Tech Stack

| Шар | Технологія |
|-----|-----------|
| Frontend | Vue 3 (Composition API) + TypeScript + Vite |
| ASR Server | Node.js + TypeScript + WebSocket (`ws`) |
| Мовне розпізнавання | sherpa-onnx (локально) / Web Speech API (fallback) |
| Стилі | Чистий CSS (без фреймворків) |
| Стан | Vue composables + localStorage |

---

## Directory Structure

```
ReadMyKans/
├── src/
│   ├── components/          # Vue SFC компоненти
│   │   ├── App.vue          # Root: управляє view (setup → reading → result)
│   │   ├── ReadingSession.vue
│   │   ├── TextInputPanel.vue
│   │   ├── FileUploadPanel.vue
│   │   ├── KanaStatsPanel.vue
│   │   ├── KanaReferenceTable.vue
│   │   ├── MicrophoneStatus.vue
│   │   ├── ResultReview.vue
│   │   └── SessionHistory.vue
│   ├── composables/         # Реюзабельна логіка
│   │   ├── useHybridSpeechRecognition.ts  # Оркестратор: server → browser fallback
│   │   ├── useServerSpeechRecognition.ts  # WebSocket ASR клієнт
│   │   ├── useSpeechRecognition.ts        # Web Speech API wrapper
│   │   ├── useTextComparison.ts           # Порівняння тексту (Levenshtein)
│   │   ├── useSessionHistory.ts           # localStorage сесії
│   │   └── useKanaAnalysis.ts             # Аналіз частоти кани
│   ├── utils/
│   │   ├── kana.ts          # Детекція хірагана/катакана
│   │   ├── levenshtein.ts   # Відстань Левенштейна
│   │   ├── textNormalize.ts # Нормалізація японської пунктуації
│   │   └── romaji.ts        # Конвертація кана → ромадзі
│   ├── types.ts             # Центральні TypeScript типи
│   └── main.ts              # Vue entry point
│
├── server/
│   ├── index.ts             # HTTP + WebSocket сервер (порт 3001)
│   ├── protocol.ts          # Типи повідомлень client↔server
│   └── asr/
│       ├── types.ts         # Інтерфейс двигуна розпізнавання
│       ├── createEngine.ts  # Фабрика двигунів
│       └── sherpaEngine.ts  # sherpa-onnx реалізація
│
├── models/                  # (git-ignored) ONNX моделі
│   └── reazonspeech-k2-v2-int8/
│
├── scripts/
│   └── download-reazon-model.mjs
│
├── .env.local               # Шляхи до моделей, порти
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json / tsconfig.server.json
└── package.json
```

---

## Key Concepts

### App Views (App.vue)
Три послідовні стани: `setup` → `reading` → `result`.

### Hybrid ASR Flow
1. `useHybridSpeechRecognition` намагається підключитись до локального сервера (WebSocket `ws://127.0.0.1:3001/asr`)
2. При невдачі — автоматичний fallback на браузерний Web Speech API
3. Мікрофон → 16kHz Float32Array фрейми → сервер → часткові/фінальні результати JSON

### Text Comparison
`useTextComparison.ts` → `compareTexts()`:
- Нормалізує японські символи (`textNormalize.ts`)
- Обчислює матрицю вирівнювання (Levenshtein)
- Повертає сегменти: `correct` / `missed` / `extra` / `mismatch`
- Витягує кану, що потребує повторення

### Session History
Зберігається в `localStorage` (останні 10 сесій). Структура: `SessionResult` з accuracy %, тривалістю, кана для повторення.

---

## TypeScript Types (src/types.ts)

```ts
SessionStatus = 'idle' | 'listening' | 'paused' | 'finished' | 'error'
AppView = 'setup' | 'reading' | 'result'
ComparisonSegment = { type: 'correct'|'missed'|'extra'|'mismatch', original?, spoken? }
SessionResult = { id, date, accuracy, duration, kanaToReview, ... }
```

---

## Environment Config (.env.local)

```env
KANA_ASR_ENCODER=models/reazonspeech-k2-v2-int8/encoder-epoch-99-avg-1.int8.onnx
KANA_ASR_DECODER=models/reazonspeech-k2-v2-int8/decoder-epoch-99-avg-1.int8.onnx
KANA_ASR_JOINER=models/reazonspeech-k2-v2-int8/joiner-epoch-99-avg-1.int8.onnx
KANA_ASR_TOKENS=models/reazonspeech-k2-v2-int8/tokens.txt
KANA_ASR_PORT=3001
KANA_ASR_HOST=127.0.0.1
KANA_ASR_THREADS=4
```

---

## npm Scripts

```bash
npm run dev            # Vite dev server (frontend :5173)
npm run dev:server     # ASR Node server (:3001)
npm run dev:all        # Обидва одночасно
npm run models:download  # Завантажити ReazonSpeech ONNX модель
npm run build          # Збірка frontend + server
npm run build:server   # Тільки server
npm run preview        # Preview production build
```

---

## Architecture Notes for Agents

- **Немає глобального стору** (Vuex/Pinia) — логіка ізольована в composables
- **Немає БД** — весь стан клієнтський (localStorage + пам'ять компонента)
- **TypeScript end-to-end** — frontend і server в одному репо, окремі `tsconfig`
- **WebSocket протокол** описаний в `server/protocol.ts` — зміни протоколу мають відображатися і в client composable (`useServerSpeechRecognition.ts`)
- **Компонент `App.vue`** є єдиним джерелом правди для поточного view та тексту сесії — не дублюй цей стан в дочірніх компонентах
- При зміні логіки порівняння — перевіряй `levenshtein.ts` і `textNormalize.ts` разом, вони тісно пов'язані
- Моделі ONNX у `.gitignore` — агент не може їх читати, посилайся на `download-reazon-model.mjs` для деталей завантаження
