/**
 * Classify India-relevant early-career jobs with prompt v2 (force refresh roles).
 * Uses Atlas from .env — not local mongo.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

async function main() {
  const limit = Number(process.env.CLASSIFY_LIMIT || 120);
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  const { PipelineLock } = await import('../models/PipelineLock.js');
  const { classifyJobRecord } = await import('../services/classification/classifyJob.js');
  const { mapWithConcurrency } = await import('../utils/http.js');
  const { env } = await import('../config/env.js');

  await connectDb();
  await PipelineLock.deleteMany({ name: 'classification' });

  const jobs = await Job.find({
    status: 'active',
    indiaRelevant: true,
    $or: [
      { fresherEligible: true },
      { employmentType: 'Internship' },
      { experienceLevel: { $in: ['Internship', 'Fresher', 'Entry Level'] } },
      {
        title: {
          $regex:
            '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b',
          $options: 'i',
        },
      },
    ],
  })
    .sort({ lastSeenAt: -1 })
    .limit(limit);

  console.log(`[classify-india] ${jobs.length} jobs · provider=${env.llm.provider} · prompt=${env.llm.promptVersion}`);

  let ok = 0;
  let failed = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let cost = 0;

  await mapWithConcurrency(jobs, env.llm.concurrency || 3, async (job) => {
    const outcome = await classifyJobRecord(job, { force: true });
    if (outcome.failed) {
      failed += 1;
      job.classification = {
        ...(job.classification?.toObject?.() || {}),
        status: 'failed',
        error: outcome.error,
        provider: outcome.meta?.provider,
        model: outcome.meta?.model,
        promptVersion: outcome.meta?.promptVersion,
        inputTokens: outcome.meta?.inputTokens || 0,
        outputTokens: outcome.meta?.outputTokens || 0,
        estimatedCost: outcome.meta?.estimatedCost || 0,
        classifiedAt: new Date(),
      };
      await job.save();
      return;
    }
    if (outcome.skipped) return;

    const r = outcome.result;
    const meta = outcome.meta;
    job.role = r.role;
    if (r.cities?.length) job.location.cities = r.cities;
    job.experienceLevel = r.experienceLevel;
    job.employmentType =
      r.employmentType !== 'Unknown' ? r.employmentType : job.employmentType;
    job.fresherEligible = r.fresherEligible;
    job.classification = {
      status: 'classified',
      provider: meta.provider,
      model: meta.model,
      promptVersion: meta.promptVersion,
      confidence: r.confidence,
      evidence: r.evidence,
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
      estimatedCost: meta.estimatedCost,
      contentHash: meta.contentHash,
      classifiedAt: new Date(),
    };
    tokensIn += meta.inputTokens || 0;
    tokensOut += meta.outputTokens || 0;
    cost += meta.estimatedCost || 0;
    ok += 1;
    await job.save();
  });

  console.log(
    JSON.stringify(
      { attempted: jobs.length, ok, failed, tokensIn, tokensOut, estimatedCost: Number(cost.toFixed(6)) },
      null,
      2,
    ),
  );
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
