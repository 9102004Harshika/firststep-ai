import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export async function createApp() {
  if (env.nodeEnv === 'production') {
    if (!env.mongodbUri || /127\.0\.0\.1|localhost/i.test(env.mongodbUri)) {
      throw new Error('Production requires a non-local MONGODB_URI');
    }
    if (env.corsOrigin === '*') {
      console.warn('[security] CORS_ORIGIN=* in production — set an explicit origin list');
    }
  }

  await connectDb();

  const app = express();
  app.disable('x-powered-by');
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((s) => s.trim()),
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({
      name: 'FirstStep AI',
      description: "India's fresher and internship opportunity intelligence platform",
      health: '/api/health',
    });
  });

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function main() {
  const app = await createApp();
  app.listen(env.port, () => {
    console.log(`FirstStep AI API listening on http://localhost:${env.port}`);
  });
}

const isDirect = process.argv[1] && process.argv[1].includes('server.js');
if (isDirect) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
