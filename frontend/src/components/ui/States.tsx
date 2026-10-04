import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { GlassCard } from './GlassCard'

export function LoadingState({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-24" />
      ))}
    </div>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <GlassCard className="flex flex-col items-center py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-white/5 text-slate-300">
        <Inbox className="size-5" aria-hidden />
      </span>
      <h3 className="font-medium text-white">{title}</h3>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-400">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </GlassCard>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <GlassCard role="alert" className="flex flex-col items-center py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-rose-300/10 text-rose-200">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <h3 className="font-medium text-white">Couldn’t load this section</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden /> Try again
        </Button>
      )}
    </GlassCard>
  )
}

/** Renders loading / error / empty / content for an async result. */
export function AsyncBoundary<T>({
  state,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  skeletonRows,
  children,
}: {
  state: { data: T | null; loading: boolean; error: string | null; reload: () => void }
  isEmpty?: (d: T) => boolean
  emptyTitle?: string
  emptyHint?: string
  skeletonRows?: number
  children: (data: T) => ReactNode
}) {
  if (state.loading && !state.data) return <LoadingState rows={skeletonRows} />
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />
  if (!state.data || isEmpty?.(state.data)) return <EmptyState title={emptyTitle} hint={emptyHint} />
  return <>{children(state.data)}</>
}
