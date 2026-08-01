import { Loader2 } from 'lucide-react'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24"
      role="status"
      aria-label="Loading"
    >
      {/* Spinners are always Loader2 + animate-spin. */}
      <Loader2 className="size-6 animate-spin text-accent" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
