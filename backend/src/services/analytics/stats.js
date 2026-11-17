import { env } from '../../config/env.js';
import { Job } from '../../models/Job.js';
import { IngestionRun } from '../../models/IngestionRun.js';
import { ClassificationRun } from '../../models/ClassificationRun.js';

export async function getStats() {
  const earlyFilter = {
    status: 'active',
    $or: [
      { fresherEligible: true },
      { employmentType: 'Internship' },
      { experienceLevel: { $in: ['Internship', 'Fresher'] } },
      {
        title: {
          $regex:
            '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level)\\b',
          $options: 'i',
        },
      },
    ],
  };

  const [
    totalActive,
    internships,
    fresherEligible,
    earlyCareer,
    indiaRelevant,
    companies,
    classified,
    pending,
    failed,
    lastIngestion,
  ] = await Promise.all([
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({
      status: 'active',
      $or: [{ employmentType: 'Internship' }, { experienceLevel: 'Internship' }],
    }),
    Job.countDocuments({ status: 'active', fresherEligible: true }),
    Job.countDocuments(earlyFilter),
    Job.countDocuments({ status: 'active', indiaRelevant: true }),
    Job.distinct('company', earlyFilter),
    Job.countDocuments({ status: 'active', 'classification.status': 'classified' }),
    Job.countDocuments({
      status: 'active',
      $or: [
        { 'classification.status': 'pending' },
        { 'classification.status': { $exists: false } },
      ],
    }),
    Job.countDocuments({ status: 'active', 'classification.status': 'failed' }),
    IngestionRun.findOne({ status: { $in: ['success', 'partial'] } })
      .sort({ finishedAt: -1 })
      .lean(),
  ]);

  return {
    totalActive,
    internships,
    fresherEligible,
    earlyCareer,
    indiaRelevant,
    companiesRepresented: companies.length,
    classified,
    pendingClassification: pending,
    classificationFailures: failed,
    lastSuccessfulRefresh: lastIngestion?.finishedAt || null,
  };
}

export async function getIngestionAnalytics() {
  const [bySource, runs, lastFailedSource] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    IngestionRun.find().sort({ startedAt: -1 }).limit(20).lean(),
    IngestionRun.findOne({ 'sourceResults.ok': false })
      .sort({ finishedAt: -1 })
      .lean(),
  ]);

  let lastFailed = null;
  if (lastFailedSource?.sourceResults) {
    const failed = [...lastFailedSource.sourceResults].reverse().find((s) => !s.ok);
    if (failed) {
      lastFailed = {
        employer: failed.employer,
        provider: failed.provider,
        boardId: failed.boardId,
        error: failed.error,
        at: lastFailedSource.finishedAt,
      };
    }
  }

  const timeline = await Job.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$firstSeenAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 60 },
  ]);

  return {
    sourceDistribution: bySource.map((s) => ({ source: s._id, count: s.count })),
    runs,
    lastFailedSource: lastFailed,
    jobsCollectedOverTime: timeline.map((t) => ({ date: t._id, count: t.count })),
  };
}

export async function getClassificationAnalytics() {
  const [
    completion,
    failures,
    runs,
    tokenAgg,
    byRole,
    byCity,
    confidenceBands,
    avgConfidence,
  ] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$classification.status', count: { $sum: 1 } } },
    ]),
    Job.countDocuments({ status: 'active', 'classification.status': 'failed' }),
    ClassificationRun.find().sort({ startedAt: -1 }).limit(20).lean(),
    Job.aggregate([
      { $match: { 'classification.status': 'classified' } },
      {
        $group: {
          _id: null,
          inputTokens: { $sum: '$classification.inputTokens' },
          outputTokens: { $sum: '$classification.outputTokens' },
          estimatedCost: { $sum: '$classification.estimatedCost' },
          count: { $sum: 1 },
          avgConfidence: { $avg: '$classification.confidence' },
          avgInputTokens: { $avg: '$classification.inputTokens' },
          avgOutputTokens: { $avg: '$classification.outputTokens' },
        },
      },
    ]),
    Job.aggregate([
      { $match: { status: 'active', 'classification.status': 'classified', role: { $nin: [null, 'Unknown'] } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    Job.aggregate([
      { $match: { status: 'active', 'classification.status': 'classified' } },
      { $unwind: { path: '$location.cities', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$location.cities', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    Job.aggregate([
      { $match: { 'classification.status': 'classified', 'classification.confidence': { $ne: null } } },
      {
        $bucket: {
          groupBy: '$classification.confidence',
          boundaries: [0, 0.5, 0.7, 0.85, 1.01],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]),
    Job.aggregate([
      { $match: { 'classification.status': 'classified' } },
      { $group: { _id: null, avg: { $avg: '$classification.confidence' } } },
    ]),
  ]);

  const tokens = tokenAgg[0] || {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
    count: 0,
    avgConfidence: 0,
    avgInputTokens: 0,
    avgOutputTokens: 0,
  };

  const completed = completion.find((c) => c._id === 'classified')?.count || 0;
  const pending =
    (completion.find((c) => c._id === 'pending')?.count || 0) +
    (completion.find((c) => !c._id)?.count || 0);
  const failedCount = completion.find((c) => c._id === 'failed')?.count || failures;
  const total = completed + pending + failedCount;

  return {
    completion: completion.map((c) => ({ status: c._id || 'pending', count: c.count })),
    completed,
    classified: completed,
    failed: failedCount,
    failures: failedCount,
    pending,
    total,
    completionRate: total ? completed / total : null,
    failures,
    runs,
    tokens,
    roleDistribution: byRole.map((r) => ({ label: r._id, count: r.count })),
    cityDistribution: byCity.map((c) => ({ label: c._id, count: c.count })),
    confidenceBands: confidenceBands.map((b) => ({
      label:
        b._id === 0
          ? '< 0.50'
          : b._id === 0.5
            ? '0.50–0.70'
            : b._id === 0.7
              ? '0.70–0.85'
              : b._id === 0.85
                ? '0.85–1.00'
                : String(b._id),
      count: b.count,
    })),
    avgConfidence: avgConfidence[0]?.avg ?? tokens.avgConfidence ?? null,
  };
}

export async function getLlmUsageAnalytics() {
  const [cost, recent, byProvider, failedSamples, runs] = await Promise.all([
    getCostAnalytics(),
    Job.find({ 'classification.status': 'classified' })
      .sort({ 'classification.classifiedAt': -1 })
      .limit(12)
      .select({
        title: 1,
        company: 1,
        role: 1,
        experienceLevel: 1,
        fresherEligible: 1,
        location: 1,
        classification: 1,
      })
      .lean(),
    Job.aggregate([
      { $match: { 'classification.provider': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$classification.provider',
          classified: {
            $sum: { $cond: [{ $eq: ['$classification.status', 'classified'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$classification.status', 'failed'] }, 1, 0] },
          },
          inputTokens: { $sum: '$classification.inputTokens' },
          outputTokens: { $sum: '$classification.outputTokens' },
          estimatedCost: { $sum: '$classification.estimatedCost' },
          avgConfidence: { $avg: '$classification.confidence' },
        },
      },
      { $sort: { estimatedCost: -1 } },
    ]),
    Job.find({ 'classification.status': 'failed' })
      .sort({ 'classification.classifiedAt': -1 })
      .limit(8)
      .select({ title: 1, company: 1, classification: 1 })
      .lean(),
    ClassificationRun.find().sort({ startedAt: -1 }).limit(10).lean(),
  ]);

  const totals = cost.totals;
  const totalTokens = (totals.inputTokens || 0) + (totals.outputTokens || 0);

  return {
    activeProvider: env.llm?.provider || process.env.LLM_PROVIDER || 'gemini',
    pricingNote: cost.notes,
    totals: {
      ...totals,
      totalTokens,
      avgTokensPerJob:
        totals.successfulClassifications > 0
          ? Math.round(totalTokens / totals.successfulClassifications)
          : null,
      avgCostPerJob:
        totals.successfulClassifications > 0
          ? Number((totals.estimatedCost / totals.successfulClassifications).toFixed(8))
          : null,
      inputShare:
        totalTokens > 0 ? Number(((totals.inputTokens || 0) / totalTokens).toFixed(3)) : null,
      outputShare:
        totalTokens > 0 ? Number(((totals.outputTokens || 0) / totalTokens).toFixed(3)) : null,
    },
    byModel: cost.byModel,
    byProvider: byProvider.map((p) => ({
      provider: p._id || 'unknown',
      classified: p.classified,
      failed: p.failed,
      inputTokens: p.inputTokens,
      outputTokens: p.outputTokens,
      estimatedCost: Number((p.estimatedCost || 0).toFixed(8)),
      avgConfidence: p.avgConfidence,
    })),
    recentClassifications: recent.map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      role: job.role,
      cities: job.location?.cities || [],
      experienceLevel: job.experienceLevel,
      fresherEligible: job.fresherEligible,
      confidence: job.classification?.confidence ?? null,
      provider: job.classification?.provider,
      model: job.classification?.model,
      inputTokens: job.classification?.inputTokens || 0,
      outputTokens: job.classification?.outputTokens || 0,
      estimatedCost: job.classification?.estimatedCost || 0,
      evidence: job.classification?.evidence || '',
      classifiedAt: job.classification?.classifiedAt,
      promptVersion: job.classification?.promptVersion,
    })),
    recentFailures: failedSamples.map((job) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      error: job.classification?.error || 'Unknown error',
      provider: job.classification?.provider,
      model: job.classification?.model,
      at: job.classification?.classifiedAt,
    })),
    runs,
    latestRun: cost.latestRun,
  };
}

export async function getCostAnalytics() {
  const [agg, latestRun] = await Promise.all([
    Job.aggregate([
      { $match: { 'classification.status': 'classified' } },
      {
        $group: {
          _id: {
            provider: '$classification.provider',
            model: '$classification.model',
          },
          inputTokens: { $sum: '$classification.inputTokens' },
          outputTokens: { $sum: '$classification.outputTokens' },
          estimatedCost: { $sum: '$classification.estimatedCost' },
          requests: { $sum: 1 },
        },
      },
    ]),
    ClassificationRun.findOne().sort({ finishedAt: -1 }).lean(),
  ]);

  const totalCost = agg.reduce((sum, row) => sum + (row.estimatedCost || 0), 0);
  const totalSuccess = agg.reduce((sum, row) => sum + (row.requests || 0), 0);
  const failed = await Job.countDocuments({ 'classification.status': 'failed' });
  const costPer1000 =
    totalSuccess > 0 ? Number(((totalCost / totalSuccess) * 1000).toFixed(6)) : null;

  return {
    measured: true,
    byModel: agg.map((row) => ({
      provider: row._id.provider,
      model: row._id.model,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      estimatedCost: Number((row.estimatedCost || 0).toFixed(8)),
      requests: row.requests,
    })),
    totals: {
      inputTokens: agg.reduce((s, r) => s + r.inputTokens, 0),
      outputTokens: agg.reduce((s, r) => s + r.outputTokens, 0),
      estimatedCost: Number(totalCost.toFixed(8)),
      successfulClassifications: totalSuccess,
      failedRequests: failed,
      costPer1000,
      avgCostPerJob:
        totalSuccess > 0 ? Number((totalCost / totalSuccess).toFixed(8)) : null,
    },
    latestRun,
    notes:
      'Costs are estimated from logged token usage and configured per-million pricing. Distinguish from provider invoice totals.',
  };
}

export async function getPipelineHealth() {
  const [stats, ingestion, classification, cost, llm] = await Promise.all([
    getStats(),
    getIngestionAnalytics(),
    getClassificationAnalytics(),
    getCostAnalytics(),
    getLlmUsageAnalytics(),
  ]);

  const latestRun = ingestion.runs[0];
  const latestClassificationRun =
    (classification.runs || []).find(
      (run) => run.status && run.status !== 'running' && (run.totals?.attempted || 0) > 0,
    ) ||
    (classification.runs || []).find((run) => run.status !== 'running') ||
    classification.runs?.[0] ||
    null;
  const sourceOk = (latestRun?.sourceResults || []).filter((s) => s.ok).length;
  const sourceFail = (latestRun?.sourceResults || []).filter((s) => !s.ok).length;

  return {
    totalJobsFetched: latestRun?.totals?.fetched || 0,
    uniqueJobsStored: stats.totalActive,
    earlyCareer: stats.earlyCareer,
    fresherEligible: stats.fresherEligible,
    internships: stats.internships,
    duplicatesDetected: latestRun?.totals?.duplicates || 0,
    invalidJobsRejected: latestRun?.totals?.rejected || 0,
    newRecordsLastRun: latestRun?.totals?.newRecords || 0,
    updatedLastRun: latestRun?.totals?.updated || 0,
    classificationSuccesses: stats.classified,
    classificationFailures: stats.classificationFailures,
    pendingClassification: stats.pendingClassification,
    classificationCompletionRate: classification.completionRate,
    avgConfidence: classification.avgConfidence,
    lastSuccessfulRefresh: stats.lastSuccessfulRefresh,
    lastFailedSource: ingestion.lastFailedSource,
    sourcesHealthy: sourceOk,
    sourcesFailed: sourceFail,
    totalLlmTokens:
      (classification.tokens.inputTokens || 0) + (classification.tokens.outputTokens || 0),
    inputTokens: classification.tokens.inputTokens || 0,
    outputTokens: classification.tokens.outputTokens || 0,
    totalLlmExpenditure: cost.totals.estimatedCost,
    costPer1000: cost.totals.costPer1000,
    averageClassificationCost:
      cost.totals.successfulClassifications > 0
        ? Number(
            (cost.totals.estimatedCost / cost.totals.successfulClassifications).toFixed(8),
          )
        : null,
    avgTokensPerJob: llm.totals.avgTokensPerJob,
    activeProvider: llm.activeProvider,
    byProvider: llm.byProvider,
    latestIngestionRun: latestRun
      ? {
          id: latestRun._id,
          status: latestRun.status,
          trigger: latestRun.trigger,
          finishedAt: latestRun.finishedAt,
          totals: latestRun.totals,
        }
      : null,
    latestClassificationRun: latestClassificationRun
      ? {
          id: latestClassificationRun._id,
          status: latestClassificationRun.status,
          provider: latestClassificationRun.provider,
          model: latestClassificationRun.model,
          totals: latestClassificationRun.totals,
          finishedAt: latestClassificationRun.finishedAt,
        }
      : null,
  };
}
