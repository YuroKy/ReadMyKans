import type { WordEntry } from './wordSources'

// Джерело «Числа, час і дати»: числівники, години, дні тижня, дати місяця і
// рідні лічильники — чистою каною з канонічним читанням (なな, よん, きゅう…).
// Неоднозначності читань тут не виникає: recognition показує кану, dictation
// озвучує кану — користувач відтворює саме показане/почуте.
// Слова доби (きょう, あさ…) живуть у словнику N5 — тут лише числове.
export const NUMBER_WORDS: WordEntry[] = [
  // Числа 0–10
  { kana: 'ゼロ', translation: '0 (нуль)' },
  { kana: 'いち', translation: '1 (один)' },
  { kana: 'に', translation: '2 (два)' },
  { kana: 'さん', translation: '3 (три)' },
  { kana: 'よん', translation: '4 (чотири)' },
  { kana: 'ご', translation: '5 (пʼять)' },
  { kana: 'ろく', translation: '6 (шість)' },
  { kana: 'なな', translation: '7 (сім)' },
  { kana: 'はち', translation: '8 (вісім)' },
  { kana: 'きゅう', translation: '9 (девʼять)' },
  { kana: 'じゅう', translation: '10 (десять)' },

  // Складені числа і розряди
  { kana: 'じゅういち', translation: '11 (одинадцять)' },
  { kana: 'じゅうご', translation: '15 (пʼятнадцять)' },
  { kana: 'にじゅう', translation: '20 (двадцять)' },
  { kana: 'さんじゅう', translation: '30 (тридцять)' },
  { kana: 'ごじゅう', translation: '50 (пʼятдесят)' },
  { kana: 'ひゃく', translation: '100 (сто)' },
  { kana: 'さんびゃく', translation: '300 (триста)' },
  { kana: 'せん', translation: '1000 (тисяча)' },
  { kana: 'まん', translation: '10 000 (десять тисяч)' },

  // Години （〜じ）
  { kana: 'いちじ', translation: '1-ша година' },
  { kana: 'にじ', translation: '2-га година' },
  { kana: 'さんじ', translation: '3-тя година' },
  { kana: 'よじ', translation: '4-та година' },
  { kana: 'ごじ', translation: '5-та година' },
  { kana: 'ろくじ', translation: '6-та година' },
  { kana: 'しちじ', translation: '7-ма година' },
  { kana: 'はちじ', translation: '8-ма година' },
  { kana: 'くじ', translation: '9-та година' },
  { kana: 'じゅうじ', translation: '10-та година' },
  { kana: 'じゅういちじ', translation: '11-та година' },
  { kana: 'じゅうにじ', translation: '12-та година' },
  { kana: 'はん', translation: 'пів (на годину); половина' },

  // Хвилини （основні форми）
  { kana: 'ごふん', translation: '5 хвилин' },
  { kana: 'じゅっぷん', translation: '10 хвилин' },
  { kana: 'さんじゅっぷん', translation: '30 хвилин' },

  // Дні тижня
  { kana: 'げつようび', translation: 'понеділок' },
  { kana: 'かようび', translation: 'вівторок' },
  { kana: 'すいようび', translation: 'середа' },
  { kana: 'もくようび', translation: 'четвер' },
  { kana: 'きんようび', translation: 'пʼятниця' },
  { kana: 'どようび', translation: 'субота' },
  { kana: 'にちようび', translation: 'неділя' },

  // Дати місяця （1-ше — 10-те）
  { kana: 'ついたち', translation: '1-ше число місяця' },
  { kana: 'ふつか', translation: '2-ге число місяця' },
  { kana: 'みっか', translation: '3-тє число місяця' },
  { kana: 'よっか', translation: '4-те число місяця' },
  { kana: 'いつか', translation: '5-те число місяця' },
  { kana: 'むいか', translation: '6-те число місяця' },
  { kana: 'なのか', translation: '7-ме число місяця' },
  { kana: 'ようか', translation: '8-ме число місяця' },
  { kana: 'ここのか', translation: '9-те число місяця' },
  { kana: 'とおか', translation: '10-те число місяця' },

  // Рідні лічильники （один-десять «штук»）
  { kana: 'ひとつ', translation: 'один (шт.)' },
  { kana: 'ふたつ', translation: 'два (шт.)' },
  { kana: 'みっつ', translation: 'три (шт.)' },
  { kana: 'よっつ', translation: 'чотири (шт.)' },
  { kana: 'いつつ', translation: 'пʼять (шт.)' },
  { kana: 'むっつ', translation: 'шість (шт.)' },
  { kana: 'ななつ', translation: 'сім (шт.)' },
  { kana: 'やっつ', translation: 'вісім (шт.)' },
  { kana: 'ここのつ', translation: 'девʼять (шт.)' },
  { kana: 'とお', translation: 'десять (шт.)' },

  // Місяці （вибірково — закріплюють числівник + がつ）
  { kana: 'いちがつ', translation: 'січень' },
  { kana: 'しがつ', translation: 'квітень' },
  { kana: 'しちがつ', translation: 'липень' },
  { kana: 'くがつ', translation: 'вересень' },
  { kana: 'じゅうにがつ', translation: 'грудень' },
]
