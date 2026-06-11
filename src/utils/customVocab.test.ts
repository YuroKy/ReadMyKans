import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseCustomVocab } from './customVocab'

describe('parseCustomVocab', () => {
  it('парсить формат «кана = переклад»', () => {
    const { entries, errors } = parseCustomVocab('ねこ = котик\nいぬ=пес')
    assert.deepEqual(entries, [
      { kana: 'ねこ', translation: 'котик' },
      { kana: 'いぬ', translation: 'пес' },
    ])
    assert.equal(errors.length, 0)
  })

  it('парсить CSV-формат, зокрема з повноширинною комою', () => {
    const { entries } = parseCustomVocab('コーヒー, кава\nみず，вода')
    assert.deepEqual(entries, [
      { kana: 'コーヒー', translation: 'кава' },
      { kana: 'みず', translation: 'вода' },
    ])
  })

  it('«=» пріоритетніший за кому (кома в перекладі лишається)', () => {
    const { entries } = parseCustomVocab('たのしい = веселий, приємний')
    assert.deepEqual(entries, [{ kana: 'たのしい', translation: 'веселий, приємний' }])
  })

  it('порожні рядки пропускаються мовчки', () => {
    const { entries, errors } = parseCustomVocab('\n\nねこ = кіт\n   \n')
    assert.equal(entries.length, 1)
    assert.equal(errors.length, 0)
  })

  it('биті рядки збираються в errors з номерами', () => {
    const { entries, errors } = parseCustomVocab('без роздільника\nkot = кіт\nねこ =')
    assert.equal(entries.length, 0)
    assert.deepEqual(
      errors.map((e) => e.line),
      [1, 2, 3],
    )
    assert.match(errors[0]!.reason, /роздільника/)
    assert.match(errors[1]!.reason, /каною/)
    assert.match(errors[2]!.reason, /порожня/)
  })

  it('дублі слова не множаться', () => {
    const { entries, errors } = parseCustomVocab('ねこ = кіт\nねこ = котяра')
    assert.equal(entries.length, 1)
    assert.equal(errors.length, 1)
    assert.match(errors[0]!.reason, /дубль/)
  })
})
