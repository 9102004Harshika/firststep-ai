import { Link } from 'react-router-dom';
import { Bookmark, ExternalLink, Trash2 } from 'lucide-react';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import { EmptyState } from '../components/StateBlock.jsx';
import { Chip } from '../components/StatusBadge.jsx';
import { formatDate } from '../utils/format.js';

export default function SavedPage() {
  const { savedList, toggleSave } = useJobWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">Workspace</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink">Saved jobs</h1>
        <p className="mt-2 text-sm text-muted">
          Bookmarks stay on this device so you can shortlist fast and apply later.
        </p>
      </div>

      {!savedList.length ? (
        <EmptyState
          title="No saved jobs yet"
          description="Tap the bookmark on any job card to build your shortlist."
          actionLabel="Explore jobs"
          onAction={() => {
            window.location.href = '/';
          }}
        />
      ) : (
        <div className="space-y-3">
          {savedList.map((job) => (
            <article
              key={job.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  to={`/jobs/${job.id}`}
                  className="font-display text-lg font-semibold text-ink hover:text-accent"
                >
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {job.company}
                  {job.city ? ` · ${job.city}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.role ? <Chip tone="accent">{job.role}</Chip> : null}
                  {job.experienceLevel ? <Chip>{job.experienceLevel}</Chip> : null}
                  <Chip>Saved {formatDate(job.savedAt, { style: 'medium' })}</Chip>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {job.applyUrl ? (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent"
                  >
                    Apply
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleSave(job)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="inline-flex items-center gap-2 text-xs text-muted">
        <Bookmark className="h-3.5 w-3.5" />
        {savedList.length} saved on this browser
      </p>
    </div>
  );
}
