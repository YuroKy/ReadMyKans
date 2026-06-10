import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { KANA_STROKES, STROKES_VIEWBOX } from './kanaStrokes'
import { HIRAGANA_ROWS, KATAKANA_ROWS } from '../utils/kana'

describe('kanaStrokes', () => {
  it('покриває всі кани базових рядів ґодзюон', () => {
    const base = [...HIRAGANA_ROWS.flat(), ...KATAKANA_ROWS.flat()].filter(Boolean)
    for (const kana of base) {
      const paths = KANA_STROKES[kana]
      assert.ok(paths && paths.length > 0, `немає рисок для «${kana}»`)
    }
  })

  it('кожна риска — валідний SVG-шлях, що починається з M', () => {
    for (const [kana, paths] of Object.entries(KANA_STROKES)) {
      for (const d of paths) {
        assert.ok(/^M/i.test(d.trim()), `риска «${kana}» не починається з M`)
      }
    }
  })

  it('viewBox відповідає KanjiVG', () => {
    assert.equal(STROKES_VIEWBOX, 109)
  })
})
