# Kana Reader

Kana Reader — це міні SPA для тренування читання японської кани вголос. Застосунок працює без бекенду: приймає введений текст або `.txt` файл, запускає розпізнавання мовлення через браузер, порівнює результат із джерелом і зберігає останні сесії в `localStorage`.

🌐 **Сайт:** https://yuroky.github.io/ReadMyKans/

## CI/CD

Кожен push у `master` запускає GitHub Actions (`.github/workflows/deploy.yml`):
**тести (`npm test`) → збірка (`npm run build`) → деплой на GitHub Pages.**
Деплой відбувається лише якщо тести пройшли.

> Один раз увімкніть Pages: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Встановлення

```bash
npm install
```

## Локальний запуск

```bash
npm run dev
```

Після запуску відкрийте адресу, яку покаже Vite, зазвичай `http://localhost:5173`.

## Локальний ASR сервер

Застосунок спершу пробує підключитися до локального Node ASR сервера на `ws://127.0.0.1:3001/asr`. Якщо сервер недоступний або модель не налаштована, інтерфейс автоматично переходить на Web Speech API.

Моделі не зберігаються в git. Папка `models/` додана в `.gitignore`.

Щоб завантажити рекомендовану японську модель ReazonSpeech k2 v2 INT8:

```bash
npm run models:download
```

Після цього стандартний запуск уже має підхопити модель автоматично:

```bash
npm run dev:server
```

Скрипт завантажить файли в:

```txt
models/reazonspeech-k2-v2-int8/
  encoder-epoch-99-avg-1.int8.onnx
  decoder-epoch-99-avg-1.int8.onnx
  joiner-epoch-99-avg-1.int8.onnx
  tokens.txt
```

Це offline transducer модель. Якщо треба запустити сервер з нестандартної папки, env можна вказати вручну:

```bash
KANA_ASR_MODE=offline
KANA_ASR_MODEL_TYPE=transducer
KANA_ASR_ENCODER=./models/reazonspeech-k2-v2-int8/encoder-epoch-99-avg-1.int8.onnx
KANA_ASR_DECODER=./models/reazonspeech-k2-v2-int8/decoder-epoch-99-avg-1.int8.onnx
KANA_ASR_JOINER=./models/reazonspeech-k2-v2-int8/joiner-epoch-99-avg-1.int8.onnx
KANA_ASR_TOKENS=./models/reazonspeech-k2-v2-int8/tokens.txt
npm run dev:server
```

Запуск тільки ASR сервера:

```bash
npm run dev:server
```

Запуск frontend і ASR сервера разом:

```bash
npm run dev:all
```

Health check:

```bash
curl http://127.0.0.1:3001/health
```

ASR сервер використовує `sherpa-onnx-node`, але модельні файли треба завантажити окремо й передати через env. Для іншої streaming CTC-моделі:

```bash
KANA_ASR_MODEL_TYPE=zipformer2Ctc
KANA_ASR_MODEL=./models/japanese/model.onnx
KANA_ASR_TOKENS=./models/japanese/tokens.txt
npm run dev:server
```

Для transducer-моделі:

```bash
KANA_ASR_MODEL_TYPE=transducer
KANA_ASR_ENCODER=./models/japanese/encoder.onnx
KANA_ASR_DECODER=./models/japanese/decoder.onnx
KANA_ASR_JOINER=./models/japanese/joiner.onnx
KANA_ASR_TOKENS=./models/japanese/tokens.txt
npm run dev:server
```

Корисні env:

- `KANA_ASR_PORT` — порт сервера, стандартно `3001`.
- `KANA_ASR_HOST` — host, стандартно `127.0.0.1`.
- `KANA_ASR_THREADS` — кількість потоків для моделі, стандартно `2`.
- `VITE_ASR_WS_URL` — WebSocket URL для frontend, якщо сервер не на стандартному host/port.

## Збірка

```bash
npm run build
```

Збірка серверного TypeScript:

```bash
npm run build:server
```

Для локальної перевірки production-збірки:

```bash
npm run preview
```

## Підтримка браузерів

Основний режим може використовувати локальний Node ASR сервер із `sherpa-onnx-node`. Якщо він недоступний, розпізнавання мовлення використовує Web Speech API (`SpeechRecognition` або `webkitSpeechRecognition`) з мовою `ja-JP`. Найкраща підтримка Web Speech зазвичай є в Chromium-браузерах. У Safari, Firefox або корпоративних середовищах API може бути недоступним або обмеженим.

Якщо Web Speech API недоступний, або користувач відхиляє доступ до мікрофона, застосунок не падає: зʼявляється ручний режим, де можна ввести розпізнаний текст для перевірки алгоритму порівняння.

## Відомі обмеження

- Web Speech API залежить від браузера, дозволів, мікрофона та мережевих сервісів розпізнавання.
- Порівняння використовує просту нормалізацію та Levenshtein distance, тому воно не виконує граматичний або фонетичний аналіз.
- Канжі не перетворюються на читання кани. Застосунок порівнює введений оригінальний текст із розпізнаним текстом після базової нормалізації.
- Історія зберігається лише локально в браузері й обмежена останніми 10 сесіями.
