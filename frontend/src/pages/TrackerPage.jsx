import { Link } from 'react-router-dom';
import { CircleCheckBig, ExternalLink } from 'lucide-react';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import { EmptyState } from '../components/StateBlock.jsx';
import { Chip } from '../components/StatusBadge.jsx';
import { formatDate } from '../utils/format.js';

const COLUMNS = [
  { key: 'interested', label: 'Interested' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
];

export default function TrackerPage() {
  const { applicationList, setApplicationStatus, clearApplication, recent } =
    useJobWorkspace();

  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [
      col.key,
      applicationList.filter((item) => item.status === col.key),
    ]),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Workspace
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">
          Application tracker
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Move roles from interested → applied → interview without losing momentum.
          Status is stored locally on this device.
        </p>
      </div>

      {!applicationList.length ? (
        <EmptyState
          title="No applications tracked yet"
          description="Use Apply or Mark applied on a job card to start your pipeline."
          actionLabel="Find jobs"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <section
              key={col.key}
              className="rounded-2xl border border-line bg-white/90 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">{col.label}</h2>
                <Chip>{grouped[col.key].length}</Chip>
              </div>
              <div className="space-y-2">
                {grouped[col.key].map((job) => (
                  <article
                    key={job.id}
                    className="rounded-xl border border-line bg-paper/60 p-3"
                  >
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-ink hover:text-accent"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">{job.company}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      Updated {formatDate(job.updatedAt, { style: 'medium' })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setApplicationStatus(job, c.key)}
                          className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:border-accent/40 hover:text-accent"
                        >
                          {c.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => clearApplication(job.id)}
                        className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-semibold text-danger"
                      >
                        Remove
                      </button>
                    </div>
                    {job.applyUrl ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent"
                      >
                        Open apply link
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {recent.length ? (
        <section className="space-y-3">
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <CircleCheckBig className="h-5 w-5 text-accent" />
            Recently viewed
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.slice(0, 6).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="rounded-2xl border border-line bg-white p-4 transition hover:border-accent/30"
              >
                <p className="font-semibold text-ink">{job.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {job.company}
                  {job.city ? ` · ${job.city}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
