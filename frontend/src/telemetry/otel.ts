// Lightweight OpenTelemetry initialization for the frontend app.
// Guards are in place so tests / SSR don't break if OTEL is disabled or unavailable.

let _tracer: any = null
let _initialized = false

export async function initOtel() {
  if (_initialized) return
  _initialized = true

  if (typeof window === 'undefined') return

  try {
    const enabled = (import.meta.env.VITE_OTEL_ENABLED as string) === 'true'
    if (!enabled) return

    const collector = (import.meta.env.VITE_OTEL_COLLECTOR_URL as string) || '/v1/traces'

    const { WebTracerProvider } = await import('@opentelemetry/sdk-trace-web')
    const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')
    const { registerInstrumentations } = await import('@opentelemetry/instrumentation')
    const { FetchInstrumentation } = await import('@opentelemetry/instrumentation-fetch')

    const provider = new WebTracerProvider()

    const exporter = new OTLPTraceExporter({ url: collector })
    provider.addSpanProcessor(new BatchSpanProcessor(exporter))

    registerInstrumentations({
      instrumentations: [new FetchInstrumentation({}),],
      tracerProvider: provider,
    })

    provider.register()
    _tracer = provider.getTracer('frontend-admin')
    ;(window as any).__OTEL_TRACER__ = _tracer
    console.info('✅ OpenTelemetry initialized (frontend)')
  } catch (e) {
    // Fail softly — do not break the app or tests if OTEL packages/config fail
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize OpenTelemetry (frontend):', e)
  }
}

export function startAdminSpan(name: string) {
  try {
    if (!_tracer) {
      const globalTracer = (window as any).__OTEL_TRACER__
      if (globalTracer) _tracer = globalTracer
    }
    if (!_tracer) return { end: () => {}, setAttribute: () => {} }
    const span = _tracer.startSpan(name)
    return span
  } catch (e) {
    return { end: () => {}, setAttribute: () => {} }
  }
}

export function endSpan(span: any) {
  try {
    if (!span) return
    span.end()
  } catch (e) {
    // noop
  }
}
