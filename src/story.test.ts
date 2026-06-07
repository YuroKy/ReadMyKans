import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeJapaneseText } from './utils/textNormalize'
import { advanceMatch } from './utils/matching'
import { compareTexts } from './composables/useTextComparison'

// ── Фікстура: рядки казки «かぐやひめ» (як їх бачить користувач) ──────────────
// Примітка: словник kuromoji у тестах не ініціалізований, тому читання = вхід.
// Рядки вже на кані, тож порівняння вимови працює напряму.
const KAGUYA = {
  title: 'かぐやひめ',
  line1: 'むかし　むかし　おじいさんが　たけやぶへ　いくと',
  line2: 'きらきら　ひかる　たけが　ありました。',
  line3: 'おじいさんが　たけを　きると　なかには',
  line4: 'かわいらしい　おんなのこが　ねむっていました。',
  // Містить づ (なづけて) — перевірка романі-толерантності
  line5: '「かぐやひめと　なづけて　たいせつに　そだてましょう。」',
  line6: 'わたしは　つきの　くにで　うまれました。',
  line7: 'おじいさん　おばあさん　さようなら。',
}

const norm = (s: string) => normalizeJapaneseText(s)
const chars = (s: string) => [...norm(s)]

describe('Казка かぐやひめ — нормалізація тексту', () => {
  it('прибирає повноширинні пробіли (U+3000) між словами', () => {
    assert.equal(norm(KAGUYA.line3), 'おじいさんがたけをきるとなかには')
  })

  it('прибирає пробіли та 。 в кінці речення', () => {
    assert.equal(norm(KAGUYA.line2), 'きらきらひかるたけがありました')
  })

  it('прибирає лапки 「」 та пунктуацію', () => {
    const out = norm(KAGUYA.line5)
    assert.equal(out, 'かぐやひめとなづけてたいせつにそだてましょう')
    assert.ok(!/[「」。、　\s]/u.test(out), 'не має лишитись пунктуації чи пробілів')
  })

  it('зберігає катакану в заголовку серії', () => {
    assert.equal(norm('おはなしシリーズ'), 'おはなしシリーズ')
  })
})

describe('Казка かぐやひめ — advanceMatch (живий матчинг)', () => {
  it('ідеальне читання рядка → повний збіг', () => {
    const original = chars(KAGUYA.line1)
    assert.equal(advanceMatch(original, original, 0), original.length)
  })

  it('часткове читання → частковий прогрес', () => {
    const original = chars(KAGUYA.line3)
    const spoken = [...norm('おじいさんがたけを')] // прочитано лише початок
    assert.equal(advanceMatch(original, spoken, 0), spoken.length)
  })

  it('толерантність до сміття ASR всередині фрази', () => {
    const original = chars(KAGUYA.line3)
    // ASR вставив сміття «ほ» між «を» і «きると»
    const spoken = [...norm('おじいさんがたけを'), 'ほ', ...norm('きるとなかには')]
    assert.equal(advanceMatch(original, spoken, 0), original.length)
  })

  it('ковзне вікно ASR: продовження з підтвердженого вказівника', () => {
    const original = chars(KAGUYA.line3)
    const anchor = [...norm('おじいさんがたけを')].length // 9
    // друга фраза без початку (вікно з'їхало)
    const spoken = [...norm('きるとなかには')]
    assert.equal(advanceMatch(original, spoken, anchor), original.length)
  })

  it('романі-толерантність: なづけて vs なずけて (づ = ず, zu)', () => {
    const original = chars(KAGUYA.line5)
    const spoken = [...norm('かぐやひめとなずけてたいせつにそだてましょう')]
    assert.equal(advanceMatch(original, spoken, 0), original.length)
  })

  it('читання частинами накопичує прогрес монотонно', () => {
    const original = chars(KAGUYA.line1)
    let progress = 0
    // три шматки поспіль
    progress = advanceMatch(original, [...norm('むかしむかし')], progress)
    progress = advanceMatch(original, [...norm('おじいさんが')], progress)
    progress = advanceMatch(original, [...norm('たけやぶへいくと')], progress)
    assert.equal(progress, original.length)
  })
})

describe('Казка かぐやひめ — compareTexts (підсумок сесії)', () => {
  it('точне читання рядка → 100% і без помилок', () => {
    const r = compareTexts(KAGUYA.line4, KAGUYA.line4)
    assert.equal(r.similarity, 100)
    assert.equal(r.mismatchCount, 0)
    assert.deepEqual(r.kanaToReview, [])
  })

  it('пропущений хвіст → нижча точність + кана для повторення', () => {
    const r = compareTexts(KAGUYA.line1, 'むかしむかし')
    assert.ok(r.similarity < 100, `очікував <100, отримав ${r.similarity}`)
    assert.ok(r.kanaToReview.length > 0)
  })

  it('романі-еквівалент づ/ず → зараховано як 100%', () => {
    const r = compareTexts('なづけて', 'なずけて')
    assert.equal(r.similarity, 100)
    assert.equal(r.mismatchCount, 0)
  })

  it('пунктуація та пробіли не впливають на точність', () => {
    const r = compareTexts(KAGUYA.line7, 'おじいさんおばあさんさようなら')
    assert.equal(r.similarity, 100)
  })

  it('одна неправильна кана → точність нижча за 100, але висока', () => {
    // замінили одну кану: くにで → くにと
    const r = compareTexts(KAGUYA.line6, 'わたしはつきのくにとうまれました')
    assert.ok(r.similarity < 100 && r.similarity > 85, `отримав ${r.similarity}`)
  })
})

describe('Казка かぐやひめ — повний прохід', () => {
  const fullStory = [
    KAGUYA.title,
    KAGUYA.line1,
    KAGUYA.line2,
    KAGUYA.line3,
    KAGUYA.line4,
    KAGUYA.line5,
    KAGUYA.line6,
    KAGUYA.line7,
  ].join('\n')

  it('ідеальне читання всієї казки → 100%', () => {
    const r = compareTexts(fullStory, fullStory)
    assert.equal(r.similarity, 100)
    assert.equal(r.mismatchCount, 0)
  })

  it('advanceMatch проходить усю казку до кінця', () => {
    const original = chars(fullStory)
    assert.equal(advanceMatch(original, original, 0), original.length)
    assert.ok(original.length > 100, 'казка має бути суттєвої довжини')
  })
})
