import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, MapPinned, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import JobCard from '../components/JobCard.jsx';
import JobFilters from '../components/JobFilters.jsx';
import Pagination from '../components/Pagination.jsx';
import StatsStrip from '../components/StatsStrip.jsx';
import { JobListSkeleton } from '../components/JobSkeleton.jsx';
import { EmptyState, ErrorState } from '../components/StateBlock.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useJobWorkspace } from '../context/JobWorkspaceContext.jsx';
import { useJobs } from '../hooks/useJobs.js';
import { formatNumber, formatRelative } from '../utils/format.js';

export default function HomePage() {
  const { stats, refreshStats, lastUpdated } = useApp();
  const { recent, savedList, applicationList } = useJobWorkspace();
  const {
    filters,
    jobs,
    pagination,
    status,
    error,
    loading,
    hasActiveFilters,
    updateFilters,
    setPage,
    resetFilters,
    reload,
  } = useJobs();

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading opportunities…';
    if (status === 'error') return 'Unable to load jobs';
    return `${formatNumber(pagination.total)} ${
      pagination.total === 1 ? 'opportunity' : 'opportunities'
    }`;
  }, [loading, status, pagination.total]);

  return (
    <div className="space-y-8">
      <section className="animate-fade-up relative overflow-hidden rounded-[2rem] border border-line bg-ink px-6 py-12 text-white md:px-12 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-indigo-100 uppercase backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              FirstStep AI
            </p>
            <h1 className="font-display mt-5 max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
              Your first opportunity starts here.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
              Real fresher jobs and internships across India — pulled from public
              career boards, deduped, and AI-tagged by role and city.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-indigo-50"
              >
                Browse openings
                <ArrowDown className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => updateFilters({ fresherEligible: 'true', earlyCareer: true })}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Fresher & intern focus
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <HeroPill
              icon={ShieldCheck}
              title="Public sources only"
              body="Greenhouse · Ashby · SmartRecruiters"
            />
            <HeroPill
              icon={MapPinned}
              title="India-first"
              body="Cities normalized for the Indian market"
            />
            <HeroPill
              icon={RefreshCw}
              title="Daily refresh"
              body={
                lastUpdated
                  ? `Updated ${formatRelative(lastUpdated)}`
                  : 'Cron-ready ingestion every 24h'
              }
            />
          </div>
        </div>
      </section>

      <StatsStrip
        stats={stats.data}
        status={stats.status}
        error={stats.error}
        onRetry={() => refreshStats().catch(() => {})}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/saved"
          className="rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-accent/30"
        >
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Saved</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {savedList.length}
          </p>
        </Link>
        <Link
          to="/tracker"
          className="rounded-2xl border border-line bg-white px-4 py-3 transition hover:border-accent/30"
        >
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            In tracker
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {applicationList.length}
          </p>
        </Link>
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Recently viewed
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink">
            {recent.length}
          </p>
        </div>
      </div>

      <JobFilters
        filters={filters}
        onChange={updateFilters}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {recent.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">Continue browsing</h2>
            <Link to="/tracker" className="text-sm font-semibold text-accent">
              Open tracker
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recent.slice(0, 8).map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="min-w-[220px] rounded-2xl border border-line bg-white p-4 transition hover:border-accent/30"
              >
                <p className="line-clamp-2 text-sm font-semibold text-ink">{job.title}</p>
                <p className="mt-1 text-xs text-muted">{job.company}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="jobs" className="scroll-mt-24 space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Open roles for freshers
            </h2>
            <p className="mt-1 text-sm text-muted">{resultLabel}</p>
          </div>
        </div>

        {loading ? <JobListSkeleton /> : null}

        {!loading && status === 'error' ? (
          <ErrorState
            title="Couldn’t load jobs"
            description={error || 'The jobs API is unavailable. Please try again shortly.'}
            onRetry={() => reload().catch(() => {})}
          />
        ) : null}

        {!loading && status === 'ok' && jobs.length === 0 ? (
          <EmptyState
            title="No matching jobs"
            description={
              hasActiveFilters
                ? 'No listings match your current filters. Clear filters to see everything.'
                : 'No active jobs are available yet. Check back after the next ingestion run.'
            }
            actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
            onAction={hasActiveFilters ? resetFilters : undefined}
          />
        ) : null}

        {!loading && status === 'ok' && jobs.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job, index) => (
                <div
                  key={job.id || job._id || index}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        ) : null}
      </section>
    </div>
  );
}

function HeroPill({ icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-indigo-100">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
    </div>
  );
}
