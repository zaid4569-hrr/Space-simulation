import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  label?: string
}

interface ErrorBoundaryState {
  failed: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) console.error('Application boundary caught an error.', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="boundary-error" role="alert">
          <p className="eyebrow">{this.props.label ?? 'Mission control interruption'}</p>
          <h2>This view could not be loaded.</h2>
          <p>Your mission data is still safe. Reload the app to continue.</p>
          <button className="button button--primary" type="button" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </section>
      )
    }
    return this.props.children
  }
}