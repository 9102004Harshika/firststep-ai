export default function MetricCard({
  label,
  value,
  hint,
  children,
  className = '',
}) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)]',
        className,
      ].join(' ')}
    >
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      {value != null ? (
        <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
          {value}
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function DistributionBars({ items = [], max }) {
  const list = Array.isArray(items) ? items : [];
  const peak =
    max ||
    Math.max(
      1,
      ...list.map((item) => Number(item.count ?? item.value ?? item.total ?? 0)),
    );

  if (!list.length) {
    return <p className="text-sm text-muted">No distribution data yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {list.map((item) => {
        const label = item.label || item.source || item.name || item.key || 'Unknown';
        const count = Number(item.count ?? item.value ?? item.total ?? 0);
        const width = Math.max(4, Math.round((count / peak) * 100));
        return (
          <li key={label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-ink-soft">{label}</span>
              <span className="shrink-0 tabular-nums text-muted">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SimpleTable({ columns = [], rows = [], empty = 'No rows' }) {
  if (!rows.length) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs tracking-wide text-muted uppercase">
            {columns.map((col) => (
              <th key={col.key} className="px-2 py-2 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row._id || idx} className="border-b border-line/70 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="px-2 py-3 text-ink-soft">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
