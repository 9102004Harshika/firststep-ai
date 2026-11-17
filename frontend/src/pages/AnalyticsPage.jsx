import { Link } from 'react-router-dom';
import { BrainCircuit, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import MetricCard, { DistributionBars, SimpleTable } from '../components/MetricCard.jsx';
import { Chip } from '../components/StatusBadge.jsx';
import { PanelError } from '../components/StateBlock.jsx';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../utils/format.js';

export default function AnalyticsPage() {
  const { ingestion, classification, cost, llm, runs, evaluation, loading, reload } =
    useAnalytics();
  const llmTotals = llm.data?.totals || cost.data?.totals || {};
  const evalMetrics = evaluation.data?.metrics || evaluation.data || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            Analytics
          </p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Opportunity + LLM intelligence
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            See where jobs come from, how classification is performing, and exactly how the
            LLM is being used — tokens, cost, confidence, and recent decisions.
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryTile
          icon={Sparkles}
          label="Classified jobs"
          value={formatNumber(
            classification.data?.classified ??
              classification.data?.completed ??
              llmTotals.successfulClassifications,
          )}
          hint={formatPercent(classification.data?.completionRate)}
        />
        <SummaryTile
          icon={BrainCircuit}
          label="LLM tokens used"
          value={formatNumber(
            llmTotals.totalTokens ??
              (llmTotals.inputTokens || 0) + (llmTotals.outputTokens || 0),
          )}
          hint={`${formatNumber(llmTotals.inputTokens)} in · ${formatNumber(llmTotals.outputTokens)} out`}
        />
        <SummaryTile
          icon={Wallet}
          label="Est. LLM spend"
          value={formatCurrency(llmTotals.estimatedCost)}
          hint={
            llmTotals.costPer1000 != null
              ? `${formatCurrency(llmTotals.costPer1000)} / 1k jobs`
              : 'Measured from logged tokens'
          }
        />
        <SummaryTile
          icon={BrainCircuit}
          label="Cost / 1k posts"
          value={formatCurrency(llmTotals.costPer1000 ?? cost.data?.totals?.costPer1000)}
          hint="Token logs × configured $/MTok"
        />
        <SummaryTile
          icon={Sparkles}
          label="Hand-check exact"
          value={
            evalMetrics.exactMatchAccuracy != null
              ? `${evalMetrics.exactMatchAccuracy}%`
              : '—'
          }
          hint={
            evalMetrics.labeledCount
              ? `${formatNumber(evalMetrics.labeledCount)} labeled posts`
              : 'Fill evaluation/benchmark.csv'
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="Source distribution" hint="Active jobs by ATS provider">
          {ingestion.status === 'error' ? (
            <PanelError message={ingestion.error} onRetry={reload} />
          ) : ingestion.status === 'loading' || ingestion.status === 'idle' ? (
            <BarsSkeleton />
          ) : (
            <DistributionBars
              items={(
                ingestion.data?.sourceDistribution ||
                ingestion.data?.sources ||
                []
              ).map((item) => ({
                label: item.source || item.label || item._id || 'unknown',
                count: item.count,
              }))}
            />
          )}
        </MetricCard>

        <MetricCard label="Classification funnel" hint="Live completion vs pending vs failed">
          {classification.status === 'error' ? (
            <PanelError message={classification.error} onRetry={reload} />
          ) : classification.status === 'loading' || classification.status === 'idle' ? (
            <BarsSkeleton />
          ) : (
            <ClassificationPanel data={classification.data} />
          )}
        </MetricCard>
      </section>

      <section>
        <MetricCard
          label="50-post hand-check"
          hint="Human labels vs AI tags — see evaluation/HANDCHECK_REPORT.md"
        >
          {evaluation.status === 'error' ? (
            <PanelError message={evaluation.error} onRetry={reload} />
          ) : evaluation.status === 'loading' || evaluation.status === 'idle' ? (
            <div className="skeleton h-28 rounded-xl" />
          ) : (
            <EvaluationPanel metrics={evalMetrics} />
          )}
        </MetricCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="AI role mix" hint="Roles assigned by the LLM">
          {classification.status === 'ok' ? (
            <DistributionBars items={classification.data?.roleDistribution || []} />
          ) : (
            <BarsSkeleton />
          )}
        </MetricCard>
        <MetricCard label="AI city mix" hint="Cities extracted by the LLM">
          {classification.status === 'ok' ? (
            <DistributionBars items={classification.data?.cityDistribution || []} />
          ) : (
            <BarsSkeleton />
          )}
        </MetricCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <MetricCard label="Confidence bands" hint="How sure the model was">
          {classification.status === 'ok' ? (
            <DistributionBars items={classification.data?.confidenceBands || []} />
          ) : (
            <BarsSkeleton />
          )}
        </MetricCard>
        <MetricCard
          label="LLM cost & provider usage"
          hint="Estimated from logged tokens × configured $/MTok"
        >
          {llm.status === 'error' && cost.status === 'error' ? (
            <PanelError message={llm.error || cost.error} onRetry={reload} />
          ) : llm.status === 'loading' || cost.status === 'loading' ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <LlmCostPanel llm={llm.data} cost={cost.data} />
          )}
        </MetricCard>
      </section>

      <section>
        <MetricCard
          label="Recent LLM decisions"
          hint="Latest classified posts with provider, tokens, confidence and evidence"
        >
          {llm.status === 'error' ? (
            <PanelError message={llm.error} onRetry={reload} />
          ) : llm.status === 'loading' || llm.status === 'idle' ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <RecentLlmTable rows={llm.data?.recentClassifications || []} />
          )}
        </MetricCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricCard label="Classification runs" hint="LLM batch jobs with tokens and spend">
          {llm.status === 'error' ? (
            <PanelError message={llm.error} onRetry={reload} />
          ) : llm.status === 'loading' || llm.status === 'idle' ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : (
            <ClassificationRunsPanel runs={llm.data?.runs || []} />
          )}
        </MetricCard>
        <MetricCard label="Token mix" hint="Input vs output share of LLM spend">
          {llm.status === 'ok' ? (
            <TokenMixPanel totals={llm.data?.totals || {}} active={llm.data?.activeProvider} />
          ) : (
            <div className="skeleton h-40 rounded-xl" />
          )}
        </MetricCard>
      </section>

      {(llm.data?.recentFailures || []).length ? (
        <section>
          <MetricCard label="Recent LLM failures" hint="Useful for prompt / provider debugging">
            <SimpleTable
              empty="No recent failures."
              columns={[
                {
                  key: 'title',
                  label: 'Job',
                  render: (row) => (
                    <div>
                      <p className="font-medium text-ink">{row.title}</p>
                      <p className="text-xs text-muted">{row.company}</p>
                    </div>
                  ),
                },
                {
                  key: 'provider',
                  label: 'Provider',
                  render: (row) => `${row.provider || '—'} / ${row.model || '—'}`,
                },
                {
                  key: 'error',
                  label: 'Error',
                  render: (row) => (
                    <span className="line-clamp-2 text-danger">{row.error}</span>
                  ),
                },
                {
                  key: 'at',
                  label: 'When',
                  render: (row) => formatDate(row.at, { includeTime: true }),
                },
              ]}
              rows={llm.data.recentFailures}
            />
          </MetricCard>
        </section>
      ) : null}

      <section>
        <MetricCard label="Ingestion history" hint="Recent refresh runs">
          {runs.status === 'error' ? (
            <PanelError message={runs.error} onRetry={reload} />
          ) : runs.status === 'loading' || runs.status === 'idle' ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : (
            <IngestionRunsPanel data={runs.data} />
          )}
        </MetricCard>
      </section>

      <p className="text-sm text-muted">
        Want operational status? Open the{' '}
        <Link to="/health" className="font-semibold text-accent">
          Pipeline page
        </Link>{' '}
        for locks, source health, and live LLM configuration.
      </p>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function EvaluationPanel({ metrics }) {
  if (!metrics?.labeledCount && !metrics?.sampleSize) {
    return (
      <p className="text-sm text-muted">
        No labeled evaluation rows yet. Open{' '}
        <code className="text-ink">evaluation/HANDCHECK_REPORT.md</code> after running the
        hand-check sheet.
      </p>
    );
  }

  const n = metrics.labeledCount || metrics.sampleSize || 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Labeled" value={formatNumber(n)} />
        <MiniStat label="Role" value={pctOrDash(metrics.roleAccuracy)} />
        <MiniStat label="City" value={pctOrDash(metrics.cityAccuracy)} />
        <MiniStat label="Experience" value={pctOrDash(metrics.experienceAccuracy)} />
        <MiniStat label="Fresher" value={pctOrDash(metrics.fresherEligibilityAccuracy)} />
      </div>
      <p className="text-sm text-muted">
        Exact-match accuracy{' '}
        <span className="font-semibold text-ink">{pctOrDash(metrics.exactMatchAccuracy)}</span>
        {metrics.readyForReporting ? ' · sample ready for reporting' : ' · need 50 labels'}
        . Working sheet lives in the repo under <code>evaluation/</code>.
      </p>
    </div>
  );
}

function pctOrDash(value) {
  return value == null ? '—' : `${value}%`;
}

function ClassificationPanel({ data }) {
  const completed =
    data?.completed ??
    data?.classified ??
    data?.completion?.find((c) => c.status === 'classified')?.count ??
    0;
  const failed =
    data?.failed ??
    data?.failures ??
    data?.completion?.find((c) => c.status === 'failed')?.count ??
    0;
  const pending =
    data?.pending ?? data?.completion?.find((c) => c.status === 'pending')?.count ?? 0;
  const rate = data?.completionRate;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Completed" value={formatNumber(completed)} />
        <MiniStat label="Failed" value={formatNumber(failed)} />
        <MiniStat label="Pending" value={formatNumber(pending)} />
      </div>
      <div>
        <p className="mb-2 text-sm text-muted">
          Completion rate ·{' '}
          <span className="font-semibold text-ink">{formatPercent(rate)}</span>
        </p>
        <DistributionBars
          items={[
            { label: 'Completed', count: completed },
            { label: 'Failed', count: failed },
            { label: 'Pending', count: pending },
          ]}
        />
      </div>
    </div>
  );
}

function LlmCostPanel({ llm, cost }) {
  const totals = llm?.totals || cost?.totals || {};
  const byProvider = llm?.byProvider || [];
  const byModel = llm?.byModel || cost?.byModel || [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Input tokens" value={formatNumber(totals.inputTokens)} />
        <MiniStat label="Output tokens" value={formatNumber(totals.outputTokens)} />
        <MiniStat label="Avg cost / job" value={formatCurrency(totals.avgCostPerJob)} />
        <MiniStat label="Cost / 1k" value={formatCurrency(totals.costPer1000)} />
      </div>

      {byProvider.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            By provider
          </p>
          <div className="space-y-2">
            {byProvider.map((row) => (
              <div
                key={row.provider}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold capitalize text-ink">{row.provider}</p>
                  <p className="text-xs text-muted">
                    {formatNumber(row.classified)} ok · {formatNumber(row.failed)} failed · avg
                    conf {formatPercent(row.avgConfidence)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">
                    {formatCurrency(row.estimatedCost)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatNumber((row.inputTokens || 0) + (row.outputTokens || 0))} tokens
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {byModel.length ? (
        <DistributionBars
          items={byModel.map((m) => ({
            label: `${m.provider || 'model'} / ${m.model || 'unknown'}`,
            count: Number(m.estimatedCost ?? m.requests ?? 0),
          }))}
        />
      ) : null}

      <p className="text-xs text-muted">
        {llm?.pricingNote ||
          cost?.notes ||
          'Estimated spend only — not a provider invoice.'}
      </p>
    </div>
  );
}

function RecentLlmTable({ rows }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-muted">
        No classified jobs with LLM metadata yet. Run classification to populate this feed.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-line bg-paper/50 p-4 transition hover:border-accent/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/jobs/${row.id}`}
                className="font-semibold text-ink hover:text-accent"
              >
                {row.title}
              </Link>
              <p className="mt-1 text-sm text-muted">
                {row.company}
                {row.cities?.length ? ` · ${row.cities.join(', ')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {row.role ? <Chip tone="accent">{row.role}</Chip> : null}
              {row.confidence != null ? (
                <Chip tone="success">{formatPercent(row.confidence)}</Chip>
              ) : null}
              <Chip>
                {row.provider || 'llm'} · {row.model || 'model'}
              </Chip>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-5">
            <p>In {formatNumber(row.inputTokens)}</p>
            <p>Out {formatNumber(row.outputTokens)}</p>
            <p>{formatCurrency(row.estimatedCost)}</p>
            <p>Prompt {row.promptVersion || '—'}</p>
            <p>{formatDate(row.classifiedAt, { includeTime: true })}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.experienceLevel ? <Chip>{row.experienceLevel}</Chip> : null}
            {row.fresherEligible === true ? <Chip tone="success">Fresher OK</Chip> : null}
            {row.fresherEligible === false ? <Chip tone="warning">Not fresher</Chip> : null}
          </div>
          {row.evidence ? (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-ink-soft">
              <span className="font-semibold text-accent">Evidence: </span>
              {row.evidence}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function ClassificationRunsPanel({ runs }) {
  if (!runs?.length) {
    return <p className="text-sm text-muted">No classification runs logged yet.</p>;
  }

  return (
    <SimpleTable
      empty="No classification runs logged yet."
      columns={[
        {
          key: 'startedAt',
          label: 'Started',
          render: (row) => formatDate(row.startedAt || row.createdAt, { includeTime: true }),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => <span className="capitalize">{row.status || '—'}</span>,
        },
        {
          key: 'model',
          label: 'Model',
          render: (row) => `${row.provider || '—'} / ${row.model || '—'}`,
        },
        {
          key: 'ok',
          label: 'OK / fail',
          render: (row) =>
            `${formatNumber(row.totals?.succeeded)} / ${formatNumber(row.totals?.failed)}`,
        },
        {
          key: 'cost',
          label: 'Cost',
          render: (row) => formatCurrency(row.totals?.estimatedCost),
        },
      ]}
      rows={runs.slice(0, 8)}
    />
  );
}

function TokenMixPanel({ totals, active }) {
  const inputShare = totals.inputShare ?? null;
  const outputShare = totals.outputShare ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Active provider ·{' '}
          <span className="font-semibold capitalize text-ink">{active || '—'}</span>
        </p>
        <Chip tone="accent">{formatNumber(totals.avgTokensPerJob)} tok / job</Chip>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${Math.round((inputShare || 0) * 100)}%` }}
          title="Input share"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <MiniStat
          label="Input share"
          value={inputShare != null ? formatPercent(inputShare) : '—'}
        />
        <MiniStat
          label="Output share"
          value={outputShare != null ? formatPercent(outputShare) : '—'}
        />
      </div>
      <p className="text-xs text-muted">
        Compact prompts keep input tokens dominant; watch output share if evidence gets verbose.
      </p>
    </div>
  );
}

function IngestionRunsPanel({ data }) {
  const rows = Array.isArray(data) ? data : data?.runs || data?.items || [];

  return (
    <SimpleTable
      empty="No ingestion runs returned by the API."
      columns={[
        {
          key: 'startedAt',
          label: 'Started',
          render: (row) =>
            formatDate(row.startedAt || row.createdAt || row.timestamp, {
              includeTime: true,
            }),
        },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <span className="font-medium capitalize">{row.status || '—'}</span>
          ),
        },
        {
          key: 'trigger',
          label: 'Trigger',
          render: (row) => row.trigger || '—',
        },
        {
          key: 'fetched',
          label: 'Fetched',
          render: (row) => formatNumber(row.totals?.fetched ?? row.fetched),
        },
        {
          key: 'new',
          label: 'New',
          render: (row) => formatNumber(row.totals?.newRecords ?? row.new),
        },
        {
          key: 'duplicates',
          label: 'Dupes',
          render: (row) => formatNumber(row.totals?.duplicates),
        },
      ]}
      rows={rows.slice(0, 12)}
    />
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function BarsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="skeleton mb-1 h-3 w-24 rounded" />
          <div className="skeleton h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
