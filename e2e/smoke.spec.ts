import { test, expect } from '@playwright/test'

// Смоук основних потоків: setup-екран, бібліотека, дрил із вводом ромадзі,
// hash-роутинг. Без голосу/мікрофона — Web Speech у headless недоступний.

test('setup-екран рендериться з бібліотекою текстів', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Kana Reader' })).toBeVisible()
  await expect(page.getByRole('button', { name: /ももたろう/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Почати читання' })).toBeVisible()
})

test('вибір тексту з бібліотеки заповнює поле вводу', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /ももたろう/ }).click()
  const textarea = page.getByLabel('Японський текст для читання')
  await expect(textarea).toHaveValue(/ももたろう/)
})

test('дрил: відповідь ромадзі зараховується', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Тренувати кану' }).click()
  await expect(page).toHaveURL(/#\/drill$/)

  // Формат «розпізнавання» — той, де є текстовий ввід ромадзі.
  await page.getByRole('button', { name: 'Розпізнавання' }).click()
  await expect(page.locator('.drill-kana')).toBeVisible()

  // Беремо правильну відповідь із підказки, щоб не дублювати транслітерацію.
  await page.getByRole('button', { name: 'Показати підказку' }).click()
  const romaji = await page.locator('.drill-hint b').textContent()
  expect(romaji).toBeTruthy()

  await page.getByPlaceholder('Введіть ромадзі (напр. mu)').fill(romaji ?? '')
  await page.getByRole('button', { name: 'Перевірити' }).click()
  await expect(page.locator('.drill-feedback.ok')).toBeVisible()
})

test('словниковий дрил показує переклад після відповіді', async ({ page }) => {
  await page.goto('/#/drill')
  await page.getByRole('button', { name: 'Розпізнавання' }).click()
  await page.getByLabel('Джерело').selectOption('vocab')

  await page.getByRole('button', { name: 'Показати підказку' }).click()
  const romaji = await page.locator('.drill-hint b').textContent()
  await page.getByPlaceholder('Введіть ромадзі (напр. mu)').fill(romaji ?? '')
  await page.getByRole('button', { name: 'Перевірити' }).click()

  await expect(page.locator('.drill-feedback.ok')).toContainText('📖')
})

test('джерело «Числа і час»: переклад у фідбеку після відповіді', async ({ page }) => {
  await page.goto('/#/drill')
  await page.getByRole('button', { name: 'Розпізнавання' }).click()
  await page.getByLabel('Джерело').selectOption('numbers')

  await page.getByRole('button', { name: 'Показати підказку' }).click()
  const romaji = await page.locator('.drill-hint b').textContent()
  await page.getByPlaceholder('Введіть ромадзі (напр. mu)').fill(romaji ?? '')
  await page.getByRole('button', { name: 'Перевірити' }).click()

  await expect(page.locator('.drill-feedback.ok')).toContainText('📖')
})

test('кандзі N5: картка показує гліф, ховає choice/writing', async ({ page }) => {
  await page.goto('/#/drill')
  await page.getByRole('button', { name: 'Розпізнавання' }).click()
  await page.getByLabel('Джерело').selectOption('kanji')

  // Формати single-kana для кандзі недоступні.
  await expect(page.getByRole('button', { name: 'Вибір' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Письмо' })).toHaveCount(0)

  // На картці — кандзі (не кана): великий гліф містить не-кана символ.
  const glyph = await page.locator('.drill-kana').textContent()
  expect(glyph).toBeTruthy()
  expect(/[一-鿿]/u.test(glyph ?? '')).toBe(true)
})

test('письмо: показує анімований порядок рисок', async ({ page }) => {
  await page.goto('/#/drill')
  await page.getByRole('button', { name: 'Письмо' }).click()

  await page.getByRole('button', { name: 'Порядок рисок' }).click()
  await expect(page.locator('.stroke-hint path').first()).toBeVisible()

  await page.getByRole('button', { name: 'Сховати риски' }).click()
  await expect(page.locator('.stroke-hint')).toHaveCount(0)
})

test('кнопка «назад» повертає з дрила на setup', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Тренувати кану' }).click()
  await expect(page).toHaveURL(/#\/drill$/)

  await page.goBack()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Kana Reader' })).toBeVisible()
})

test('диплінк #/drill відкриває дрил одразу', async ({ page }) => {
  await page.goto('/#/drill')
  await expect(page.getByRole('heading', { level: 1, name: 'Практика кани' })).toBeVisible()
})

test('екзамен: диплінк відкриває інтро, спроба цього тижня вето-редіректить', async ({ page }) => {
  await page.goto('/#/exam')
  await expect(page.getByRole('heading', { name: '🎓 Екзамен' })).toBeVisible()

  // Зі складеним цього тижня екзаменом диплінк відбиває на setup.
  await page.evaluate(() => {
    const now = new Date()
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
    const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7)
    const isoWeek = `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    localStorage.setItem(
      'kana-exam',
      JSON.stringify([{ week: isoWeek, date: now.toISOString(), correct: 45, total: 50, accuracy: 90, passed: true }]),
    )
  })
  // goto на той самий URL не перезавантажує сторінку — потрібен reload.
  await page.reload()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Kana Reader' })).toBeVisible()
})

test('сторінка досягнень рендерить сітку з прогресом', async ({ page }) => {
  await page.goto('/#/achievements')
  await expect(page.getByRole('heading', { name: '🏆 Досягнення' })).toBeVisible()
  await expect(page.locator('.ach-card').first()).toBeVisible()
})

test('диплінк #/result без результату веде на setup', async ({ page }) => {
  await page.goto('/#/result')
  await expect(page.getByRole('heading', { level: 1, name: 'Kana Reader' })).toBeVisible()
  await expect(page).toHaveURL(/#\/$/)
})
