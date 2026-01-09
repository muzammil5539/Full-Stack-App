import { test, expect } from '@playwright/test'

test('smoke: home page loads and has expected elements', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/?$/)
  await expect(page.locator('text=Storefront')).toBeVisible()
  await expect(page.locator('a', { hasText: 'Shop products' })).toHaveAttribute('href', '/products')
  await expect(page.locator('a', { hasText: 'View cart' })).toHaveAttribute('href', '/cart')
})
