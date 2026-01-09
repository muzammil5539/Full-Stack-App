import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initOtel } from './telemetry/otel'

// Initialize OpenTelemetry for the web app (no-op if disabled).
void initOtel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
