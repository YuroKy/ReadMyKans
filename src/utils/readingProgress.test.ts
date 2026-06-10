import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReadingProgress } from './readingProgress'

test('parseReadingProgress: валідний снапшот повертається як є', () => {
  const raw = JSON.stringify({
    text: 'かぐやひめ',
    confirmedLen: 3,
    elapsedMs: 42_000,
    savedAt: '2026-06-10T10:00:00.000Z',
  })
  assert.deepEqual(parseReadingProgress(raw), {
    text: 'かぐやひめ',
    confirmedLen: 3,
    elapsedMs: 42_000,
    savedAt: '2026-06-10T10:00:00.000Z',
  })
})

test('parseReadingProgress: null, порожнє і битий JSON → null', () => {
  assert.equal(parseReadingProgress(null), null)
  assert.equal(parseReadingProgress(''), null)
  assert.equal(parseReadingProgress('{не json'), null)
  assert.equal(parseReadingProgress('"рядок"'), null)
})

test('parseReadingProgress: нульовий або кривий прогрес → null', () => {
  assert.equal(parseReadingProgress(JSON.stringify({ text: 'あ', confirmedLen: 0 })), null)
  assert.equal(parseReadingProgress(JSON.stringify({ text: 'あ', confirmedLen: -2 })), null)
  assert.equal(parseReadingProgress(JSON.stringify({ text: '', confirmedLen: 5 })), null)
  assert.equal(parseReadingProgress(JSON.stringify({ confirmedLen: 5 })), null)
  assert.equal(parseReadingProgress(JSON.stringify({ text: 'あ', confirmedLen: 'x' })), null)
})

test('parseReadingProgress: відсутні elapsedMs/savedAt мають безпечні дефолти', () => {
  const parsed = parseReadingProgress(JSON.stringify({ text: 'あいう', confirmedLen: 2.7 }))
  assert.deepEqual(parsed, { text: 'あいう', confirmedLen: 2, elapsedMs: 0, savedAt: '' })
})
