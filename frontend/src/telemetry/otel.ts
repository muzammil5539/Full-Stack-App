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

    // Use dynamic variable imports so Vite's static analysis won't try to resolve optional runtime deps.
    // @ts-ignore: optional runtime dependency; avoid build-time type resolution
    const traceWebPkg = '@opentelemetry/sdk-trace-web'
    const { WebTracerProvider } = await import(/* @vite-ignore */ traceWebPkg as any)
    // @ts-ignore: optional runtime dependency; avoid build-time type resolution
    const traceBasePkg = '@opentelemetry/sdk-trace-base'
    const { BatchSpanProcessor } = await import(/* @vite-ignore */ traceBasePkg as any)
    // @ts-ignore: optional runtime dependency; avoid build-time type resolution
    const exporterPkg = '@opentelemetry/exporter-trace-otlp-http'
    const { OTLPTraceExporter } = await import(/* @vite-ignore */ exporterPkg as any)
    // @ts-ignore: optional runtime dependency; avoid build-time type resolution
    const instrumentationPkg = '@opentelemetry/instrumentation'
    const { registerInstrumentations } = await import(/* @vite-ignore */ instrumentationPkg as any)
    // @ts-ignore: optional runtime dependency; avoid build-time type resolution
    const fetchPkg = '@opentelemetry/instrumentation-fetch'
    const { FetchInstrumentation } = await import(/* @vite-ignore */ fetchPkg as any)

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
