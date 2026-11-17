import { Router } from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import { listJobs, getJob, getSimilarJobs } from '../controllers/jobsController.js';
import {
  stats,
  ingestionAnalytics,
  classificationAnalytics,
  costAnalytics,
  ingestionRuns,
  pipelineHealth,
  evaluationSummary,
  llmUsageAnalytics,
} from '../controllers/analyticsController.js';
import { triggerIngestion, triggerClassification } from '../controllers/adminController.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    service: 'firststep-ai',
    env: env.nodeEnv,
    database: env.mongodbDbName,
    llm: {
      provider: env.llm.provider,
      model: env.llm.provider === 'openai' ? env.llm.openaiModel : env.llm.model,
      fallback: env.llm.fallbackProvider ? [env.llm.fallbackProvider] : [],
      promptVersion: env.llm.promptVersion,
      pricing: env.llm.pricing,
      geminiConfigured: Boolean(env.llm.geminiApiKey),
      groqConfigured: Boolean(env.llm.groqApiKey),
      openaiConfigured: Boolean(env.llm.openaiApiKey),
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/jobs', listJobs);
router.get('/jobs/:id/similar', getSimilarJobs);
router.get('/jobs/:id', getJob);
router.get('/stats', stats);
router.get('/analytics/ingestion', ingestionAnalytics);
router.get('/analytics/classification', classificationAnalytics);
router.get('/analytics/cost', costAnalytics);
router.get('/analytics/llm', llmUsageAnalytics);
router.get('/analytics/pipeline', pipelineHealth);
router.get('/ingestion/runs', ingestionRuns);
router.get('/evaluation/summary', evaluationSummary);

router.post('/admin/ingestion/run', requireAdmin, triggerIngestion);
router.post('/admin/classification/run', requireAdmin, triggerClassification);

export default router;
