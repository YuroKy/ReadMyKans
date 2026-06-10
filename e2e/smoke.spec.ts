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

  // Формат «впізнавання» — той, де є текстовий ввід ромадзі.
  await page.getByRole('button', { name: 'Впізнавання' }).click()
  await expect(page.locator('.drill-kana')).toBeVisible()

  // Беремо правильну відповідь із підказки, щоб не дублювати транслітерацію.
  await page.getByRole('button', { name: 'Показати підказку' }).click()
  const romaji = await page.locator('.drill-hint b').textContent()
  expect(romaji).toBeTruthy()

  await page.getByPlaceholder('Введіть ромадзі (напр. mu)').fill(romaji ?? '')
  await page.getByRole('button', { name: 'Перевірити' }).click()
  await expect(page.locator('.drill-feedback.ok')).toBeVisible()
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

test('диплінк #/result без результату веде на setup', async ({ page }) => {
  await page.goto('/#/result')
  await expect(page.getByRole('heading', { level: 1, name: 'Kana Reader' })).toBeVisible()
  await expect(page).toHaveURL(/#\/$/)
})
