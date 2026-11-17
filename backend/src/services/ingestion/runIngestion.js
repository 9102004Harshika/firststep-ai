import { IngestionRun } from '../../models/IngestionRun.js';
import { getEnabledSources } from './sourceRegistry.js';
import { fetchJobsForSource } from './adapters/index.js';
import { normalizeJob } from './normalization/normalizeJob.js';
import { upsertNormalizedJobs } from './deduplication/upsertJobs.js';
import { acquireLock, releaseLock } from '../../utils/lock.js';

export async function runIngestion({ trigger = 'manual' } = {}) {
  const lock = await acquireLock('ingestion', trigger);
  if (!lock.acquired) {
    return {
      ok: false,
      status: 'locked',
      message: 'Another ingestion run is already in progress',
      existing: lock.existing,
    };
  }

  const run = await IngestionRun.create({
    status: 'running',
    trigger,
    lockToken: lock.token,
    startedAt: new Date(),
  });

  const totals = {
    fetched: 0,
    valid: 0,
    newRecords: 0,
    updated: 0,
    duplicates: 0,
    rejected: 0,
    failed: 0,
  };
  const sourceResults = [];

  try {
    const sources = getEnabledSources();

    for (const source of sources) {
      const started = Date.now();
      try {
        const rawJobs = await fetchJobsForSource(source);
        const normalized = rawJobs.map((job) => normalizeJob(job));
        const stats = await upsertNormalizedJobs(normalized);

        totals.fetched += rawJobs.length;
        totals.valid += stats.valid;
        totals.newRecords += stats.newRecords;
        totals.updated += stats.updated;
        totals.duplicates += stats.duplicates;
        totals.rejected += stats.rejected;
        totals.failed += stats.failed;

        sourceResults.push({
          employer: source.employer,
          provider: source.provider,
          boardId: source.boardId,
          ok: true,
          fetched: rawJobs.length,
          durationMs: Date.now() - started,
        });
      } catch (error) {
        totals.failed += 1;
        sourceResults.push({
          employer: source.employer,
          provider: source.provider,
          boardId: source.boardId,
          ok: false,
          fetched: 0,
          error: error.message,
          durationMs: Date.now() - started,
        });
        console.warn(`[ingestion] ${source.provider}/${source.boardId} failed:`, error.message);
      }
    }

    const failedSources = sourceResults.filter((s) => !s.ok).length;
    const okSources = sourceResults.filter((s) => s.ok).length;
    let status = 'success';
    if (okSources === 0) status = 'failed';
    else if (failedSources > 0) status = 'partial';

    run.status = status;
    run.totals = totals;
    run.sourceResults = sourceResults;
    run.finishedAt = new Date();
    await run.save();

    return {
      ok: status !== 'failed',
      status,
      runId: run._id,
      totals,
      sourceResults,
    };
  } catch (error) {
    run.status = 'failed';
    run.error = error.message;
    run.totals = totals;
    run.sourceResults = sourceResults;
    run.finishedAt = new Date();
    await run.save();
    throw error;
  } finally {
    await releaseLock('ingestion', lock.token);
  }
}
