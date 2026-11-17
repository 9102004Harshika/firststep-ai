import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '../utils/format.js';

export default function Pagination({ pagination, onPageChange }) {
  const page = Number(pagination?.page) || 1;
  const totalPages = Number(pagination?.totalPages) || 1;
  const total = Number(pagination?.total) || 0;
  const limit = Number(pagination?.limit) || 12;

  if (totalPages <= 1 && total <= limit) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
      <p className="text-sm text-muted">
        Showing{' '}
        <span className="font-medium text-ink">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{' '}
        of <span className="font-medium text-ink">{formatNumber(total)}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="min-w-20 text-center text-sm font-medium text-ink-soft">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition enabled:hover:border-accent enabled:hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
