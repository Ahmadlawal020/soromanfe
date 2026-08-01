import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20">
            <AlertTriangle className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="size-3.5 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
