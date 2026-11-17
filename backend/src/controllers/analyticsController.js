import {
  getStats,
  getIngestionAnalytics,
  getClassificationAnalytics,
  getCostAnalytics,
  getPipelineHealth,
  getLlmUsageAnalytics,
} from '../services/analytics/stats.js';
import { IngestionRun } from '../models/IngestionRun.js';
import { getEvaluationSummary } from '../services/evaluation/exportImport.js';

export async function stats(_req, res, next) {
  try {
    res.json({ ok: true, data: await getStats() });
  } catch (error) {
    next(error);
  }
}

export async function ingestionAnalytics(_req, res, next) {
  try {
    res.json({ ok: true, data: await getIngestionAnalytics() });
  } catch (error) {
    next(error);
  }
}

export async function classificationAnalytics(_req, res, next) {
  try {
    res.json({ ok: true, data: await getClassificationAnalytics() });
  } catch (error) {
    next(error);
  }
}

export async function costAnalytics(_req, res, next) {
  try {
    res.json({ ok: true, data: await getCostAnalytics() });
  } catch (error) {
    next(error);
  }
}

export async function ingestionRuns(_req, res, next) {
  try {
    const runs = await IngestionRun.find().sort({ startedAt: -1 }).limit(50).lean();
    res.json({ ok: true, data: runs });
  } catch (error) {
    next(error);
  }
}

export async function pipelineHealth(_req, res, next) {
  try {
    res.json({ ok: true, data: await getPipelineHealth() });
  } catch (error) {
    next(error);
  }
}

export async function evaluationSummary(_req, res, next) {
  try {
    res.json({ ok: true, data: await getEvaluationSummary() });
  } catch (error) {
    next(error);
  }
}

export async function llmUsageAnalytics(_req, res, next) {
  try {
    res.json({ ok: true, data: await getLlmUsageAnalytics() });
  } catch (error) {
    next(error);
  }
}
