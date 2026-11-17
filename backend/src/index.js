import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectMongo } from './db/mongo.js';
import healthRouter from './routes/health.js';

async function main() {
  await connectMongo();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', healthRouter);

  app.get('/', (_req, res) => {
    res.json({
      name: 'FirstStep AI',
      description: "India's fresher and internship opportunity intelligence platform",
      docs: '/api/health',
    });
  });

  app.listen(env.port, () => {
    console.log(`FirstStep AI API listening on http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start FirstStep AI API:', error);
  process.exit(1);
});
