import { Router } from 'express';
import { getDb } from '../db/mongo.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });

    res.json({
      ok: true,
      service: 'firststep-ai',
      env: env.nodeEnv,
      database: env.mongodbDbName,
      llm: {
        provider: env.llm.provider,
        model: env.llm.model,
        fallback: env.llm.fallbackOrder,
        geminiConfigured: Boolean(env.llm.geminiApiKey),
        openaiConfigured: Boolean(env.llm.openaiApiKey),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error.message,
    });
  }
});

export default router;
