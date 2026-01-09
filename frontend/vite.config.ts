import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
// Allow vitest `test` config here; casting to `unknown` avoids `any` lint rule.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        '@opentelemetry/sdk-trace-web',
        '@opentelemetry/sdk-trace-base',
        '@opentelemetry/exporter-trace-otlp-http',
        '@opentelemetry/instrumentation',
        '@opentelemetry/instrumentation-fetch',
      ],
    },
  },
  // Avoid pre-bundling OpenTelemetry packages during dev; they are optional runtime deps.
  optimizeDeps: {
    exclude: [
      '@opentelemetry/sdk-trace-web',
      '@opentelemetry/sdk-trace-base',
      '@opentelemetry/exporter-trace-otlp-http',
      '@opentelemetry/instrumentation',
      '@opentelemetry/instrumentation-fetch',
    ],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
