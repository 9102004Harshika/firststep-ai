import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_PORT,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

async function main() {
  const dbPath = ensureFirststepMongoDir();
  const mongod = await MongoMemoryServer.create({
    instance: { port: FIRSTSTEP_MONGO_PORT, dbPath, storageEngine: 'wiredTiger' },
  });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = 'firststep_ai';
  process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { PipelineLock } = await import('../models/PipelineLock.js');
  const { Job } = await import('../models/Job.js');
  const { classifyJobRecord } = await import('../services/classification/classifyJob.js');
  const { mapWithConcurrency } = await import('../utils/http.js');
  const { env } = await import('../config/env.js');

  await connectDb();
  await PipelineLock.deleteMany({});

  const limit = Number(process.env.CLASSIFY_LIMIT || 220);
  const jobs = await Job.find({
    status: 'active',
    fresherEligible: true,
    $or: [
      { 'classification.status': { $in: ['pending', 'failed'] } },
      { 'classification.status': { $exists: false } },
      { role: 'Unknown' },
    ],
  })
    .sort({ lastSeenAt: -1 })
    .limit(limit);

  console.log(`Classifying ${jobs.length} early-career jobs with ${process.env.LLM_PROVIDER}`);

  const totals = { attempted: 0, succeeded: 0, failed: 0, skipped: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0 };

  await mapWithConcurrency(jobs, env.llm.concurrency, async (job) => {
    totals.attempted += 1;
    const outcome = await classifyJobRecord(job, { force: false });
    if (outcome.skipped) {
      totals.skipped += 1;
      return;
    }
    if (outcome.failed) {
      totals.failed += 1;
      totals.inputTokens += outcome.meta?.inputTokens || 0;
      totals.outputTokens += outcome.meta?.outputTokens || 0;
      totals.estimatedCost += outcome.meta?.estimatedCost || 0;
      job.classification = {
        status: 'failed',
        model: outcome.meta?.model,
        provider: outcome.meta?.provider,
        promptVersion: outcome.meta?.promptVersion,
        classifiedAt: new Date(),
        inputTokens: outcome.meta?.inputTokens || 0,
        outputTokens: outcome.meta?.outputTokens || 0,
        estimatedCost: outcome.meta?.estimatedCost || 0,
        contentHash: outcome.meta?.contentHash,
        error: outcome.error,
      };
      await job.save();
      return;
    }

    totals.succeeded += 1;
    totals.inputTokens += outcome.meta.inputTokens;
    totals.outputTokens += outcome.meta.outputTokens;
    totals.estimatedCost += outcome.meta.estimatedCost;

    job.role = outcome.result.role;
    job.experienceLevel = outcome.result.experienceLevel;
    job.employmentType = outcome.result.employmentType;
    // Keep heuristic true if LLM returns null for clearly early-career posts
    job.fresherEligible =
      outcome.result.fresherEligible == null ? true : outcome.result.fresherEligible;
    if (outcome.result.cities?.length) {
      job.location.cities = outcome.result.cities;
      if (job.location.country === 'Unknown') job.location.country = 'India';
    }
    job.classification = {
      status: 'classified',
      model: outcome.meta.model,
      provider: outcome.meta.provider,
      promptVersion: outcome.meta.promptVersion,
      confidence: outcome.result.confidence,
      classifiedAt: new Date(),
      evidence: outcome.result.evidence,
      inputTokens: outcome.meta.inputTokens,
      outputTokens: outcome.meta.outputTokens,
      estimatedCost: outcome.meta.estimatedCost,
      contentHash: outcome.meta.contentHash,
    };
    await job.save();
  });

  const summary = {
    totals: {
      ...totals,
      estimatedCost: Number(totals.estimatedCost.toFixed(8)),
    },
    fresherEligible: await Job.countDocuments({ status: 'active', fresherEligible: true }),
    classifiedFresher: await Job.countDocuments({
      status: 'active',
      fresherEligible: true,
      'classification.status': 'classified',
    }),
  };
  console.log(JSON.stringify(summary, null, 2));

  await disconnectDb();
  await mongod.stop({ doCleanup: false, force: false });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
