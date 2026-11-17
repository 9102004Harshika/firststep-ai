import {
  Activity,
  BrainCircuit,
  Database,
  KeyRound,
  RefreshCw,
  Server,
  TriangleAlert,
  Waves,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MetricCard, { SimpleTable } from '../components/MetricCard.jsx';
import { Chip } from '../components/StatusBadge.jsx';
import { ErrorState } from '../components/StateBlock.jsx';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../utils/format.js';
import { getApiBaseLabel } from '../services/api.js';

export default function HealthPage() {
  const { health, ingestion, runs, classification, pipeline, llm, loading, reload } =
    useAnalytics();

  const healthData = health.data;
  const pipe = pipeline.data || {};
  const ok = health.status === 'ok' && healthData?.ok !== false;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Pipeline health
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Operations console
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            Live ingestion, classification, and LLM spend health. API base:{' '}
            <code className="text-ink">{getApiBaseLabel()}</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => reload()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {health.status === 'error' ? (
        <ErrorState
          title="Health endpoint unreachable"
          description={health.error || 'Could not reach /api/health.'}
          onRetry={reload}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          icon={Activity}
          label="API"
          value={ok ? 'Healthy' : health.status === 'loading' ? 'Checking' : 'Degraded'}
          tone={ok ? 'success' : health.status === 'loading' ? 'neutral' : 'danger'}
        />
        <StatusTile
          icon={Database}
          label="Database"
          value={healthData?.database || '—'}
          tone="neutral"
        />
        <StatusTile
          icon={BrainCircuit}
          label="Active LLM"
          value={
            healthData?.llm
              ? `${healthData.llm.provider} / ${healthData.llm.model}`
              : pipe.activeProvider || '—'
          }
          tone="neutral"
        />
        <StatusTile
          icon={Server}
          label="Environment"
          value={healthData?.env || '—'}
          tone="neutral"
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Ingestion pulse" hint="Last successful refresh outcomes">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Fetched" value={pipe.totalJobsFetched} />
            <Stat label="Unique stored" value={pipe.uniqueJobsStored} />
            <Stat label="New last run" value={pipe.newRecordsLastRun} />
            <Stat label="Duplicates" value={pipe.duplicatesDetected} />
            <Stat label="Sources OK" value={pipe.sourcesHealthy} />
            <Stat label="Sources failed" value={pipe.sourcesFailed} />
          </dl>
          <p className="mt-4 text-xs text-muted">
            Last refresh:{' '}
            {formatDate(pipe.lastSuccessfulRefresh, { includeTime: true })}
          </p>
        </MetricCard>

        <MetricCard label="Classification pulse" hint="Coverage of the job corpus">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Classified" value={pipe.classificationSuccesses} />
            <Stat label="Failed" value={pipe.classificationFailures} />
            <Stat label="Pending" value={pipe.pendingClassification} />
            <Stat
              label="Completion"
              value={formatPercent(pipe.classificationCompletionRate)}
              raw
            />
            <Stat label="Avg confidence" value={formatPercent(pipe.avgConfidence)} raw />
            <Stat label="Early-career" value={pipe.earlyCareer} />
          </dl>
        </MetricCard>

        <MetricCard label="LLM spend pulse" hint="Measured token economics">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Stat label="Total tokens" value={pipe.totalLlmTokens} />
            <Stat label="Input tokens" value={pipe.inputTokens} />
            <Stat label="Output tokens" value={pipe.outputTokens} />
            <Stat
              label="Est. spend"
              value={formatCurrency(pipe.totalLlmExpenditure)}
              raw
            />
            <Stat
              label="Avg / job"
              value={formatCurrency(pipe.averageClassificationCost)}
              raw
            />
            <Stat label="Cost / 1k" value={formatCurrency(pipe.costPer1000)} raw />
          </dl>
          <p className="mt-4 text-xs text-muted">
            Avg tokens/job: {formatNumber(pipe.avgTokensPerJob)}
          </p>
        </MetricCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="LLM configuration">
          <dl className="space-y-3 text-sm">
            <Row
              icon={KeyRound}
              label="Gemini"
              value={healthData?.llm?.geminiConfigured ? 'Ready' : 'Missing key'}
              ok={Boolean(healthData?.llm?.geminiConfigured)}
            />
            <Row
              icon={KeyRound}
              label="OpenAI"
              value={healthData?.llm?.openaiConfigured ? 'Ready' : 'Missing key'}
              ok={Boolean(healthData?.llm?.openaiConfigured)}
            />
            <Row
              icon={KeyRound}
              label="Groq"
              value={healthData?.llm?.groqConfigured ? 'Ready' : 'Missing key'}
              ok={Boolean(healthData?.llm?.groqConfigured)}
            />
            <Row
              icon={BrainCircuit}
              label="Prompt version"
              value={healthData?.llm?.promptVersion || '—'}
            />
            <Row
              icon={Waves}
              label="Fallback"
              value={
                Array.isArray(healthData?.llm?.fallback) && healthData.llm.fallback.length
                  ? healthData.llm.fallback.join(' → ')
                  : 'None'
              }
            />
            <Row
              icon={Activity}
              label="Pricing $/MTok"
              value={
                healthData?.llm?.pricing
                  ? `in ${healthData.llm.pricing.inputPerMTok} · out ${healthData.llm.pricing.outputPerMTok}`
                  : '—'
              }
            />
          </dl>
        </MetricCard>

        <MetricCard label="Provider breakdown" hint="Where classification spend went">
          {(pipe.byProvider || llm.data?.byProvider || []).length ? (
            <div className="space-y-3">
              {(pipe.byProvider || llm.data?.byProvider || []).map((row) => (
                <div
                  key={row.provider}
                  className="rounded-xl border border-line bg-paper/70 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold capitalize text-ink">{row.provider}</p>
                    <Chip tone="accent">{formatCurrency(row.estimatedCost)}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatNumber(row.classified)} classified · {formatNumber(row.failed)}{' '}
                    failed · {formatNumber((row.inputTokens || 0) + (row.outputTokens || 0))}{' '}
                    tokens · conf {formatPercent(row.avgConfidence)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No provider usage logged yet.</p>
          )}
        </MetricCard>
      </section>

      {pipe.lastFailedSource ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger-soft/40 px-4 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Last failed source</p>
            <p className="mt-1">
              {pipe.lastFailedSource.employer} ({pipe.lastFailedSource.provider}/
              {pipe.lastFailedSource.boardId}) — {pipe.lastFailedSource.error}
            </p>
            <p className="mt-1 text-xs opacity-80">
              {formatDate(pipe.lastFailedSource.at, { includeTime: true })}
            </p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="Latest ingestion run">
          {pipe.latestIngestionRun ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd className="font-semibold capitalize text-ink">
                  {pipe.latestIngestionRun.status}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Trigger</dt>
                <dd className="font-medium text-ink">{pipe.latestIngestionRun.trigger}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Finished</dt>
                <dd className="font-medium text-ink">
                  {formatDate(pipe.latestIngestionRun.finishedAt, { includeTime: true })}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Fetched / new / dupes</dt>
                <dd className="font-medium text-ink">
                  {formatNumber(pipe.latestIngestionRun.totals?.fetched)} /{' '}
                  {formatNumber(pipe.latestIngestionRun.totals?.newRecords)} /{' '}
                  {formatNumber(pipe.latestIngestionRun.totals?.duplicates)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">No ingestion runs yet.</p>
          )}
        </MetricCard>

        <MetricCard label="Latest classification run">
          {pipe.latestClassificationRun ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd className="font-semibold capitalize text-ink">
                  {pipe.latestClassificationRun.status}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Model</dt>
                <dd className="font-medium text-ink">
                  {pipe.latestClassificationRun.provider} /{' '}
                  {pipe.latestClassificationRun.model}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Succeeded / failed</dt>
                <dd className="font-medium text-ink">
                  {formatNumber(pipe.latestClassificationRun.totals?.succeeded)} /{' '}
                  {formatNumber(pipe.latestClassificationRun.totals?.failed)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Tokens / cost</dt>
                <dd className="font-medium text-ink">
                  {formatNumber(
                    (pipe.latestClassificationRun.totals?.inputTokens || 0) +
                      (pipe.latestClassificationRun.totals?.outputTokens || 0),
                  )}{' '}
                  · {formatCurrency(pipe.latestClassificationRun.totals?.estimatedCost)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">No classification runs yet.</p>
          )}
        </MetricCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="Recent ingestion runs">
          {runs.status === 'error' ? (
            <p className="text-sm text-danger">{runs.error}</p>
          ) : runs.status === 'loading' || runs.status === 'idle' ? (
            <div className="skeleton h-36 rounded-xl" />
          ) : (
            <SimpleTable
              empty="No ingestion runs available."
              columns={[
                {
                  key: 'startedAt',
                  label: 'Started',
                  render: (row) =>
                    formatDate(row.startedAt || row.createdAt, { includeTime: true }),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <span className="capitalize">{row.status || '—'}</span>,
                },
                {
                  key: 'trigger',
                  label: 'Trigger',
                  render: (row) => row.trigger || '—',
                },
                {
                  key: 'fetched',
                  label: 'Fetched',
                  render: (row) => formatNumber(row.totals?.fetched),
                },
                {
                  key: 'new',
                  label: 'New',
                  render: (row) => formatNumber(row.totals?.newRecords),
                },
                {
                  key: 'failed',
                  label: 'Failed src',
                  render: (row) =>
                    formatNumber((row.sourceResults || []).filter((s) => !s.ok).length),
                },
              ]}
              rows={
                Array.isArray(runs.data)
                  ? runs.data.slice(0, 10)
                  : (runs.data?.runs || []).slice(0, 10)
              }
            />
          )}
        </MetricCard>

        <MetricCard label="Recent LLM decisions" hint="Live classification trail users can inspect">
          {(llm.data?.recentClassifications || []).length ? (
            <div className="space-y-3">
              {llm.data.recentClassifications.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-line bg-paper/60 px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/jobs/${row.id}`}
                        className="font-semibold text-ink hover:text-accent"
                      >
                        {row.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {row.company}
                        {row.role ? ` · ${row.role}` : ''}
                      </p>
                    </div>
                    <Chip tone="accent">
                      {formatPercent(row.confidence)} · {row.provider || 'llm'}
                    </Chip>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {formatNumber(row.inputTokens)} in / {formatNumber(row.outputTokens)} out ·{' '}
                    {formatCurrency(row.estimatedCost)} · prompt {row.promptVersion || '—'}
                  </p>
                  {row.evidence ? (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{row.evidence}</p>
                  ) : null}
                </div>
              ))}
              <Link to="/analytics" className="text-sm font-semibold text-accent">
                Open full LLM feed →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted">
              No classified jobs with LLM metadata yet.{' '}
              <Link to="/analytics" className="font-semibold text-accent">
                Analytics
              </Link>
            </p>
          )}
        </MetricCard>
      </section>

      {(llm.data?.runs || []).length ? (
        <MetricCard label="Classification run history" hint="Batch LLM jobs">
          <SimpleTable
            empty="No classification runs."
            columns={[
              {
                key: 'startedAt',
                label: 'Started',
                render: (row) =>
                  formatDate(row.startedAt || row.createdAt, { includeTime: true }),
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <span className="capitalize">{row.status || '—'}</span>,
              },
              {
                key: 'prompt',
                label: 'Prompt',
                render: (row) => row.promptVersion || '—',
              },
              {
                key: 'ok',
                label: 'OK / fail',
                render: (row) =>
                  `${formatNumber(row.totals?.succeeded)} / ${formatNumber(row.totals?.failed)}`,
              },
              {
                key: 'tokens',
                label: 'Tokens',
                render: (row) =>
                  formatNumber(
                    (row.totals?.inputTokens || 0) + (row.totals?.outputTokens || 0),
                  ),
              },
              {
                key: 'cost',
                label: 'Cost',
                render: (row) => formatCurrency(row.totals?.estimatedCost),
              },
            ]}
            rows={llm.data.runs.slice(0, 8)}
          />
        </MetricCard>
      ) : null}
    </div>
  );
}

function StatusTile({ icon: Icon, label, value, tone = 'neutral' }) {
  const tones = {
    success: 'border-success/20 bg-success-soft/40',
    danger: 'border-danger/20 bg-danger-soft/40',
    neutral: 'border-line bg-white',
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-3 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Stat({ label, value, raw = false }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-ink">
        {raw ? value ?? '—' : formatNumber(value)}
      </dd>
    </div>
  );
}

function Row({ icon: Icon, label, value, ok }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd
        className={[
          'text-right font-medium',
          ok === true ? 'text-success' : ok === false ? 'text-danger' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}
