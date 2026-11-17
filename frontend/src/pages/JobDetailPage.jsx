import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardCopy,
  ExternalLink,
  MapPin,
  Sparkles,
  Tag,
} from 'lucide-react';
import JobCard from '../components/JobCard.jsx';
import { DetailSkeleton } from '../components/JobSkeleton.jsx';
import { ErrorState } from '../components/StateBlock.jsx';
import { ClassificationBadge, Chip, LocationBadge } from '../components/StatusBadge.jsx';
import { useJobDetail } from '../hooks/useJobDetail.js';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import { fetchSimilarJobs } from '../services/jobsApi.js';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../utils/format.js';
import {
  APPLY_CHECKLIST,
  buildApplicationSummary,
  extractSkillHints,
  getApplyUrl,
  getCity,
  getCompanyName,
  getJobId,
  getPostedDate,
  isFresherEligible,
  isNewJob,
  isRemoteJob,
} from '../utils/jobHelpers.js';

const STATUS_OPTIONS = [
  { value: 'interested', label: 'Interested' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

export default function JobDetailPage() {
  const { id } = useParams();
  const { job, loading, status, error } = useJobDetail(id);
  const {
    isSaved,
    toggleSave,
    getApplication,
    setApplicationStatus,
    trackView,
    notes,
    setJobNote,
  } = useJobWorkspace();
  const [similar, setSimilar] = useState([]);
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState(() =>
    Object.fromEntries(APPLY_CHECKLIST.map((_, i) => [i, false])),
  );

  useEffect(() => {
    if (job) trackView(job);
  }, [job, trackView]);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    fetchSimilarJobs(id)
      .then((rows) => {
        if (!cancelled) setSimilar(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setSimilar([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (status === 'error' || !job) {
    return (
      <ErrorState
        title="Job not found"
        description={error || 'This listing could not be loaded from the API.'}
      />
    );
  }

  const jobId = getJobId(job);
  const company = getCompanyName(job);
  const city = getCity(job);
  const applyUrl = getApplyUrl(job);
  const posted = getPostedDate(job);
  const description =
    job.description ||
    job.summary ||
    job.descriptionHtml ||
    job.descriptionText ||
    '';
  const skills = extractSkillHints(job);
  const application = getApplication(jobId);
  const saved = isSaved(jobId);
  const note = notes[String(jobId)] || '';

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildApplicationSummary(job));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      <section className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <ClassificationBadge job={job} />
          <LocationBadge job={job} />
          {isFresherEligible(job) ? <Chip tone="success">Fresher eligible</Chip> : null}
          {isNewJob(job) ? <Chip tone="success">New</Chip> : null}
          {isRemoteJob(job) ? <Chip tone="accent">Remote</Chip> : null}
        </div>

        <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          {job.title || 'Untitled role'}
        </h1>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-muted" />
            {company}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted" />
            {city || 'Unknown location'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted" />
            Posted {formatDate(posted)}
          </span>
          {job.source ? (
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted" />
              Source · {job.source}
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {job.role || job.category ? (
            <Chip tone="accent">{job.role || job.category}</Chip>
          ) : null}
          {job.experienceLevel || job.experience ? (
            <Chip>{job.experienceLevel || job.experience}</Chip>
          ) : null}
          {job.employmentType || job.type ? (
            <Chip>{job.employmentType || job.type}</Chip>
          ) : null}
        </div>

        {skills.length ? (
          <div className="mt-5">
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              Skills spotted in posting
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setApplicationStatus(job, 'applied')}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent"
            >
              Apply on official site
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => toggleSave(job)}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition',
              saved
                ? 'border-accent/30 bg-accent-soft text-accent'
                : 'border-line text-ink-soft hover:border-accent/40 hover:text-accent',
            ].join(' ')}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {saved ? 'Saved' : 'Save job'}
          </button>
          <button
            type="button"
            onClick={copySummary}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink-soft transition hover:border-accent/40 hover:text-accent"
          >
            <ClipboardCopy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy apply summary'}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-ink">Role overview</h2>
          <div className="prose-job mt-4 whitespace-pre-wrap text-sm leading-7 text-ink-soft">
            {description
              ? description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
              : 'No description provided by the source board.'}
          </div>
          <div className="mt-6 rounded-xl border border-line bg-paper/70 p-4 text-sm text-ink-soft">
            <p className="font-semibold text-ink">Opportunity trust signals</p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  India relevance
                </dt>
                <dd className="mt-1 text-ink">
                  {job.indiaRelevant ? 'Yes' : 'No / unverified'}
                  {job.geographicEvidence?.type && job.geographicEvidence.type !== 'unknown'
                    ? ` · ${job.geographicEvidence.type}`
                    : ''}
                </dd>
                {job.geographicEvidence?.matchedText ? (
                  <p className="mt-1 text-xs text-muted">
                    Geo evidence: {job.geographicEvidence.matchedText}
                  </p>
                ) : null}
                {job.geoExclusionReason ? (
                  <p className="mt-1 text-xs text-danger">Excluded: {job.geoExclusionReason}</p>
                ) : null}
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                  Source freshness
                </dt>
                <dd className="mt-1 text-ink">
                  Last seen {formatDate(job.lastSeenAt, { includeTime: true })}
                </dd>
                <p className="mt-1 text-xs text-muted">
                  {job.source}/{job.sourceBoard} · first seen{' '}
                  {formatDate(job.firstSeenAt, { includeTime: true })}
                </p>
              </div>
            </dl>
          </div>

          {job.classification?.status === 'classified' || job.classification?.evidence ? (
            <div className="mt-6 rounded-xl bg-accent-soft/60 p-4 text-sm text-ink-soft">
              <p className="inline-flex items-center gap-1.5 font-semibold text-accent">
                <Sparkles className="h-4 w-4" />
                LLM classification
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.classification?.provider ? (
                  <Chip tone="accent">
                    {job.classification.provider}
                    {job.classification.model ? ` · ${job.classification.model}` : ''}
                  </Chip>
                ) : null}
                {job.classification?.confidence != null ? (
                  <Chip tone="success">
                    {formatPercent(job.classification.confidence)} confidence
                  </Chip>
                ) : null}
                {job.classification?.promptVersion ? (
                  <Chip>prompt {job.classification.promptVersion}</Chip>
                ) : null}
              </div>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="font-semibold tracking-wide text-muted uppercase">Tokens</dt>
                  <dd className="mt-0.5 text-ink">
                    {formatNumber(job.classification?.inputTokens)} in /{' '}
                    {formatNumber(job.classification?.outputTokens)} out
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold tracking-wide text-muted uppercase">Est. cost</dt>
                  <dd className="mt-0.5 text-ink">
                    {formatCurrency(job.classification?.estimatedCost)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold tracking-wide text-muted uppercase">Classified</dt>
                  <dd className="mt-0.5 text-ink">
                    {formatDate(job.classification?.classifiedAt, { includeTime: true })}
                  </dd>
                </div>
              </dl>
              {job.classification?.evidence ? (
                <p className="mt-3">
                  <span className="font-semibold text-accent">Evidence: </span>
                  {job.classification.evidence}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">Application tracker</h2>
            <label className="mt-3 block text-xs font-semibold tracking-wide text-muted uppercase">
              Status
              <select
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                value={application?.status || ''}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setApplicationStatus(job, e.target.value);
                }}
              >
                <option value="">Not tracking</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold tracking-wide text-muted uppercase">
              Notes
              <textarea
                className="mt-1.5 min-h-24 w-full rounded-xl border border-line px-3 py-2.5 text-sm"
                placeholder="Referral name, follow-up date, interview tips…"
                value={note}
                onChange={(e) => setJobNote(jobId, e.target.value)}
              />
            </label>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <CheckSquare className="h-4 w-4 text-accent" />
              Apply faster checklist
            </h2>
            <ul className="mt-3 space-y-2">
              {APPLY_CHECKLIST.map((item, index) => (
                <li key={item}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(checklist[index])}
                      onChange={(e) =>
                        setChecklist((prev) => ({ ...prev, [index]: e.target.checked }))
                      }
                    />
                    <span className={checklist[index] ? 'line-through opacity-60' : ''}>
                      {item}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {similar.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Similar openings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {similar.map((item) => (
              <JobCard key={getJobId(item)} job={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
