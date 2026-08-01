import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#/components/ui/empty'

interface PageErrorProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function PageError({ title = 'Something went wrong', message, onRetry }: PageErrorProps) {
  return (
    <Empty className="my-6 border-destructive/40 py-16" role="alert">
      <EmptyMedia className="bg-destructive/10 text-destructive">
        <AlertCircle />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-md">{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
