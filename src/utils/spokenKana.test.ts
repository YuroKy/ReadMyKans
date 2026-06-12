import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalSpokenKana } from './spokenKana'

describe('canonicalSpokenKana', () => {
  it('зводить орфографію і kuromoji-вимову до однієї форми', () => {
    // Пари «як у тексті» ↔ «як віддає kuromoji» (зібрані емпірично
    // скриптом scripts/check-translations.mts на текстах бібліотеки).
    const pairs: Array<[string, string]> = [
      ['わたしは', 'わたしわ'],
      ['こんにちは', 'こんにちわ'],
      ['やまへ', 'やまえ'],
      ['ありがとうございます', 'ありがとーございます'],
      ['おはようございます', 'おはよーございます'],
      ['おばあさんが', 'おばーさんが'],
      ['おじいさんと', 'おじーさんと'],
      ['ちいさいけれど', 'ちーさいけれど'],
      ['きゅうに', 'きゅーに'],
      ['なづけましょう', 'なずけましょう'],
      ['べんきょうします', 'べんきょーします'],
      ['いっすんぼうしは', 'いっすんぼうしわ'],
      ['おおきな', 'おーきな'],
    ]
    for (const [spelled, spoken] of pairs) {
      assert.equal(
        canonicalSpokenKana(spelled),
        canonicalSpokenKana(spoken),
        `${spelled} ↔ ${spoken}`,
      )
    }
  })

  it('зводить катакану до хіраґани', () => {
    assert.equal(canonicalSpokenKana('テレビ'), 'てれび')
    assert.equal(canonicalSpokenKana('コーヒー'), 'こーひー')
  })

  it('не стягує дифтонги та голосні різних рядів', () => {
    // あい/えあ — не довгі голосні, kuromoji їх не зливає.
    assert.equal(canonicalSpokenKana('ねがいが'), 'ねがいが')
    assert.equal(canonicalSpokenKana('けらい'), 'けらい')
    assert.equal(canonicalSpokenKana('まえ'), 'まえ')
  })

  it('ん і っ розривають подовження', () => {
    assert.equal(canonicalSpokenKana('ほんを'), 'ほんお')
    assert.equal(canonicalSpokenKana('がっこう'), 'がっこー')
  })
})
