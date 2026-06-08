# Kana Reader

Kana Reader is a small browser SPA for practising reading Japanese kana (hiragana / katakana) out loud. It runs entirely in the browser — no backend: you paste text or upload a `.txt` file, the app recognises speech via the Web Speech API, compares it to the source, and stores recent sessions in `localStorage`.

🌐 **Live site:** https://yuroky.github.io/ReadMyKans/

## CI/CD

Every push to `master` runs GitHub Actions (`.github/workflows/deploy.yml`):
**tests (`npm test`) → build (`npm run build`) → deploy to GitHub Pages.**
Deployment only happens if the tests pass.

> Enable Pages once: **Settings → Pages → Build and deployment → Source: GitHub Actions.**

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Then open the URL Vite prints, usually `http://localhost:5173`.

## Modes

- **Kana practice** — a flashcard drill: a kana is shown, you answer by voice (push-to-talk) or by typing romaji, and get instant feedback. The chunk size (1 kana → word → line) is adjustable with a slider.
  - **Learning stats:** mistakes are remembered per kana. Kana you struggle with get highlighted, the card reminds you which kana you tend to confuse it with, and after a wrong answer the app explains the difference (e.g. *む = "mu", も = "mo" — same vowel, different consonant*). The finish screen lists the kana worth reviewing.
- **Reading** — read the text aloud continuously; at the end you get an accuracy score and the kana to review.

Speech recognition uses the browser **Web Speech API** (`ja-JP`). A Chromium-based browser, microphone permission and an internet connection are required.

## Tests

```bash
npm test
```

Tests (node:test + tsx) cover the pure logic: normalisation, romaji, matching, chunking, drill state, push-to-talk state machine and learning stats.

## Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Kanji readings

Kanji are converted to kana readings via `kuromoji` (dictionary lazy-loaded, ~15 MB, cached). The default text and the drill are pure kana, so they work even without the dictionary (graceful degradation).

## Browser support

Recognition relies on the Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`, `ja-JP`). Best support is in Chromium browsers (Chrome, Edge). In Safari / Firefox the API may be unavailable.

If the microphone is unavailable or permission is denied, the drill still accepts romaji input, and the reading mode offers manual text entry.

## Known limitations

- The Web Speech API depends on the browser, permissions, the microphone and network services.
- Recognising a single isolated kana is the weakest spot for ASR; romaji input is always available as a reliable fallback.
- Comparison uses reading normalisation plus a romaji-tolerant Levenshtein distance — no deep phonetic analysis.
- Stats and history are stored locally (last 10 sessions for history).

## License

Copyright (C) 2026 Yurii Fedelesh

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

It is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the full text in [`LICENSE`](LICENSE).

Because Kana Reader is served over a network, the AGPL (section 13) requires that anyone interacting with it remotely can obtain the corresponding source code. The source is available at <https://github.com/YuroKy/ReadMyKans>.
