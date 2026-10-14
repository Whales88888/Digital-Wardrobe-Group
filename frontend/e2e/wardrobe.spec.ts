import { expect, test } from '@playwright/test'

test('a user can register and add a clothing piece', async ({ page }) => {
  const email = `browser-${Date.now()}@example.test`
  await page.goto('/register')
  await page.getByLabel('Name').fill('Browser Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('browser-test-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)

  await page.getByRole('link', { name: 'My wardrobe' }).click()
  await page.getByRole('button', { name: 'Add clothing' }).click()
  await page.getByLabel('Item name').fill('Browser test jacket')
  await page.getByRole('dialog').getByLabel('Category').selectOption({ label: 'Tops' })
  await page.getByRole('button', { name: 'Add to wardrobe' }).click()
  await expect(page.getByRole('heading', { name: 'Browser test jacket' })).toBeVisible()
})
