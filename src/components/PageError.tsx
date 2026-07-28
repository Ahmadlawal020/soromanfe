import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface PageErrorProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function PageError({ title = 'Something went wrong', message, onRetry }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4" role="alert">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
        <AlertCircle size={24} className="text-destructive" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} className="mr-1.5" />
          Try Again
        </Button>
      )}
    </div>
  )
}
