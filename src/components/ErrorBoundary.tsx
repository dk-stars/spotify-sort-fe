import React from 'react'

type State = { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Something went wrong loading the page</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#c00' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
  }
}
