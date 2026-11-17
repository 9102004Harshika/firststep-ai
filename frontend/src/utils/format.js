export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const { style = 'medium', includeTime = false } = options;

  if (style === 'relative') {
    return formatRelative(date);
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? { hour: '2-digit', minute: '2-digit' }
      : {}),
  }).format(date);
}

export function formatRelative(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = Date.now() - date.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (minutes < 1) return 'just now';
  if (minutes < 60) return rtf.format(-Math.sign(diffMs) * minutes || -minutes, 'minute');
  if (hours < 24) return rtf.format(-Math.sign(diffMs) * hours || -hours, 'hour');
  if (days < 30) return rtf.format(-Math.sign(diffMs) * days || -days, 'day');
  return formatDate(date);
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN').format(Number(value));
}

export function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 4,
  }).format(Number(value));
}

export function formatPercent(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const ratio = n > 1 ? n / 100 : n;
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return Number(count) === 1 ? singular : plural;
}
