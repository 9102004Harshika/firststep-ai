import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  CircleCheckBig,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { ClassificationBadge, Chip, LocationBadge } from './StatusBadge.jsx';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import {
  daysSincePosted,
  getApplyUrl,
  getCity,
  getCompanyName,
  getJobId,
  getPostedDate,
  isFresherEligible,
  isNewJob,
  isRemoteJob,
} from '../utils/jobHelpers.js';
import { formatDate } from '../utils/format.js';

export default function JobCard({ job }) {
  const id = getJobId(job);
  const company = getCompanyName(job);
  const city = getCity(job);
  const applyUrl = getApplyUrl(job);
  const posted = getPostedDate(job);
  const title = job?.title || 'Untitled role';
  const role = job?.role || job?.category || job?.department;
  const experience = job?.experienceLevel || job?.experience;
  const employment = job?.employmentType || job?.type;
  const source = job?.source || job?.board || job?.provider;
  const days = daysSincePosted(job);
  const { isSaved, toggleSave, getApplication, setApplicationStatus } = useJobWorkspace();
  const saved = id ? isSaved(id) : false;
  const application = id ? getApplication(id) : null;

  return (
    <article className="group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-accent to-teal-400 transition duration-300 group-hover:scale-x-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {isNewJob(job) ? <Chip tone="success">New</Chip> : null}
            {isRemoteJob(job) ? <Chip tone="accent">Remote</Chip> : null}
            {application?.status ? (
              <Chip tone="warning">{application.status.replace('_', ' ')}</Chip>
            ) : null}
          </div>
          <Link
            to={id ? `/jobs/${id}` : '#'}
            className="font-display text-lg leading-snug font-semibold text-ink transition group-hover:text-accent"
          >
            {title}
          </Link>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-soft">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className="truncate">{company}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ClassificationBadge job={job} />
          {id ? (
            <button
              type="button"
              onClick={() => toggleSave(job)}
              className={[
                'rounded-lg border p-2 transition',
                saved
                  ? 'border-accent/30 bg-accent-soft text-accent'
                  : 'border-line text-muted hover:border-accent/30 hover:text-accent',
              ].join(' ')}
              aria-label={saved ? 'Remove bookmark' : 'Save job'}
              title={saved ? 'Saved' : 'Save for later'}
            >
              {saved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5" />
          {city || 'Location TBD'}
        </span>
        <LocationBadge job={job} />
        {days != null ? (
          <span className="text-xs text-muted">
            {days === 0 ? 'Posted today' : `${days}d ago`}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {role && role !== 'Unknown' ? <Chip tone="accent">{role}</Chip> : null}
        {experience ? <Chip>{experience}</Chip> : null}
        {employment ? <Chip>{employment}</Chip> : null}
        {isFresherEligible(job) ? <Chip tone="success">Fresher eligible</Chip> : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div className="min-w-0 text-xs text-muted">
          <p>Posted {formatDate(posted, { style: 'medium' })}</p>
          {source ? <p className="mt-0.5 truncate">Source · {source}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {id ? (
            <Link
              to={`/jobs/${id}`}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft transition hover:bg-paper-2 hover:text-ink"
            >
              Details
            </Link>
          ) : null}
          {id ? (
            <button
              type="button"
              onClick={() => setApplicationStatus(job, 'applied')}
              className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink-soft transition hover:border-success/40 hover:text-success"
              title="Mark as applied"
            >
              <CircleCheckBig className="h-3.5 w-3.5" />
              Applied
            </button>
          ) : null}
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setApplicationStatus(job, 'applied')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent"
            >
              Apply
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <span className="rounded-xl bg-paper-2 px-3.5 py-2 text-sm font-medium text-muted">
              No link
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
