import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3" role="status" aria-label="Loading">
      <Loader2 size={32} className="animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
