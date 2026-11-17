import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export function EmptyState({
  title = 'No results',
  description = 'Try adjusting your filters or search terms.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/70 px-6 py-16 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-2 text-muted">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data from the API.',
  onRetry,
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger-soft/40 px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-danger shadow-sm">
        <AlertCircle className="h-5 w-5" />
      </span>
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-soft">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function PanelError({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-danger/15 bg-danger-soft/50 px-4 py-3 text-sm text-danger">
      <div className="flex items-start justify-between gap-3">
        <p>{message || 'Failed to load'}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-semibold underline-offset-2 hover:underline"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
