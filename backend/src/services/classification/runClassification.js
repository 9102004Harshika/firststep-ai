import { Job } from '../../models/Job.js';
import { ClassificationRun } from '../../models/ClassificationRun.js';
import { env, assertLlmConfigured } from '../../config/env.js';
import { mapWithConcurrency } from '../../utils/http.js';
import { acquireLock, releaseLock } from '../../utils/lock.js';
import { classifyJobRecord } from './classifyJob.js';

export async function runClassification({
  trigger = 'manual',
  limit = 500,
  force = false,
  onlyPending = true,
} = {}) {
  assertLlmConfigured(env.llm.provider);

  const lock = await acquireLock('classification', trigger);
  if (!lock.acquired) {
    return {
      ok: false,
      status: 'locked',
      message: 'Another classification run is already in progress',
    };
  }

  const activeModel =
    env.llm.provider === 'openai'
      ? env.llm.openaiModel || 'gpt-4o-mini'
      : env.llm.model;

  const run = await ClassificationRun.create({
    status: 'running',
    trigger,
    provider: env.llm.provider,
    model: activeModel,
    promptVersion: env.llm.promptVersion,
    startedAt: new Date(),
  });

  const totals = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
  };

  try {
    const query = { status: 'active' };
    if (onlyPending && !force) {
      query.$or = [
        { 'classification.status': { $in: ['pending', 'failed'] } },
        { 'classification.status': { $exists: false } },
        { role: 'Unknown' },
      ];
    }

    const jobs = await Job.find(query).sort({ lastSeenAt: -1 }).limit(limit);

    await mapWithConcurrency(jobs, env.llm.concurrency, async (job) => {
      totals.attempted += 1;
      const outcome = await classifyJobRecord(job, { force });

      if (outcome.skipped) {
        totals.skipped += 1;
        return;
      }

      if (outcome.failed) {
        totals.failed += 1;
        totals.inputTokens += outcome.meta.inputTokens || 0;
        totals.outputTokens += outcome.meta.outputTokens || 0;
        totals.estimatedCost += outcome.meta.estimatedCost || 0;
        job.classification = {
          status: 'failed',
          model: outcome.meta.model,
          provider: outcome.meta.provider,
          promptVersion: outcome.meta.promptVersion,
          classifiedAt: new Date(),
          inputTokens: outcome.meta.inputTokens,
          outputTokens: outcome.meta.outputTokens,
          estimatedCost: outcome.meta.estimatedCost,
          contentHash: outcome.meta.contentHash,
          error: outcome.error,
        };
        await job.save();
        return;
      }

      totals.succeeded += 1;
      totals.inputTokens += outcome.meta.inputTokens;
      totals.outputTokens += outcome.meta.outputTokens;
      totals.estimatedCost += outcome.meta.estimatedCost;

      const { result, meta } = outcome;
      job.role = result.role;
      job.experienceLevel = result.experienceLevel;
      job.employmentType = result.employmentType;
      job.fresherEligible = result.fresherEligible;
      if (result.cities?.length) {
        job.location.cities = result.cities;
        if (job.location.country === 'Unknown') job.location.country = 'India';
      }
      job.classification = {
        status: 'classified',
        model: meta.model,
        provider: meta.provider,
        promptVersion: meta.promptVersion,
        confidence: result.confidence,
        classifiedAt: new Date(),
        evidence: result.evidence,
        inputTokens: meta.inputTokens,
        outputTokens: meta.outputTokens,
        estimatedCost: meta.estimatedCost,
        contentHash: meta.contentHash,
      };
      await job.save();
    });

    const status =
      totals.failed > 0 && totals.succeeded === 0
        ? 'failed'
        : totals.failed > 0
          ? 'partial'
          : 'success';

    run.status = status;
    run.totals = {
      ...totals,
      estimatedCost: Number(totals.estimatedCost.toFixed(8)),
    };
    run.finishedAt = new Date();
    await run.save();

    return { ok: status !== 'failed', status, runId: run._id, totals: run.totals };
  } catch (error) {
    run.status = 'failed';
    run.error = error.message;
    run.totals = totals;
    run.finishedAt = new Date();
    await run.save();
    throw error;
  } finally {
    await releaseLock('classification', lock.token);
  }
}
