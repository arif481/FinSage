import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback?: ReactNode
}

interface ErrorBoundaryState {
    error: Error | null
    hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { error: null, hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error, hasError: true }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[FinSage ErrorBoundary]', error, info.componentStack)
    }

    private isChunkLoadError(error: Error | null): boolean {
        if (!error?.message) return false
        const message = error.message.toLowerCase()
        return (
            message.includes('failed to fetch dynamically imported module')
            || message.includes('importing a module script failed')
            || message.includes('dynamically imported module')
        )
    }

    handleReset = () => {
        if (this.isChunkLoadError(this.state.error)) {
            window.location.reload()
            return
        }
        this.setState({ error: null, hasError: false })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem 1rem',
                        textAlign: 'center',
                        minHeight: '200px',
                        gap: '1rem',
                    }}
                >
                    <p style={{ fontSize: '2.5rem', margin: 0 }}>⚠️</p>
                    <h3 style={{ margin: 0 }}>Something went wrong</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
                        {this.state.error?.message ?? 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="primary-button"
                        type="button"
                        onClick={this.handleReset}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {this.isChunkLoadError(this.state.error) ? 'Reload app' : 'Try again'}
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}
