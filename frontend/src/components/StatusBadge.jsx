import { getClassificationStatus, isUnknownLocation } from '../utils/jobHelpers.js';

const CLASSIFICATION_STYLES = {
  classified: 'bg-success-soft text-success',
  pending: 'bg-warning-soft text-warning',
  failed: 'bg-danger-soft text-danger',
  unknown: 'bg-paper-2 text-muted',
};

const CLASSIFICATION_LABELS = {
  classified: 'AI classified',
  pending: 'Pending',
  failed: 'Classification failed',
  unknown: 'Unclassified',
};

export function ClassificationBadge({ job }) {
  const status = getClassificationStatus(job);
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        CLASSIFICATION_STYLES[status],
      ].join(' ')}
    >
      {CLASSIFICATION_LABELS[status]}
    </span>
  );
}

export function LocationBadge({ job }) {
  if (!isUnknownLocation(job)) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-paper-2 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-muted">
      Unknown location
    </span>
  );
}

export function Chip({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-paper-2 text-ink-soft',
    accent: 'bg-accent-soft text-accent',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
  };
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone] || tones.neutral,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
