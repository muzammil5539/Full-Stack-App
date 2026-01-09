import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'playwright-tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
