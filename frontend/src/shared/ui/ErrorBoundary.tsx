import React from 'react'

type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<Record<string, unknown>>, State> {
  constructor(props: React.PropsWithChildren<Record<string, unknown>>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Placeholder for telemetry/logging integration — intentionally not noisy
    // Mark as used to satisfy lint rules
    void console.error?.(error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-slate-600">An unexpected error occurred. Try refreshing the page.</p>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}
