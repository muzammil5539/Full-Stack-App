import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', 'src/**/__tests__/**'],
    exclude: ['node_modules', 'e2e/**', 'playwright-tests/**', '**/*.extra.test.*'],
  },
})
