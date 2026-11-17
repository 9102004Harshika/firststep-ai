/**
 * Dev API stack. Uses MONGODB_URI from .env (Atlas preferred).
 * Set USE_LOCAL_MONGO=1 only if you explicitly want the local firststep-mongo helper.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function maybeStartLocalMongo() {
  if (process.env.USE_LOCAL_MONGO !== '1') return null;
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const {
    FIRSTSTEP_MONGO_DB_PATH,
    FIRSTSTEP_MONGO_PORT,
    ensureFirststepMongoDir,
  } = await import('../config/localMongo.js');
  ensureFirststepMongoDir();
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: FIRSTSTEP_MONGO_PORT,
      dbPath: FIRSTSTEP_MONGO_DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });
  process.env.MONGODB_URI = mongod.getUri();
  console.log(`[dev-stack] local firststep-mongo ${process.env.MONGODB_URI}`);
  return mongod;
}

async function main() {
  await maybeStartLocalMongo();
  process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'firststep_ai';
  console.log(
    `[dev-stack] mongo db=${process.env.MONGODB_DB_NAME} uri=${String(process.env.MONGODB_URI).replace(/\/\/.*@/, '//***@')}`,
  );

  const { connectDb } = await import('../config/db.js');
  const { env } = await import('../config/env.js');
  const { Job } = await import('../models/Job.js');
  const { runIngestion } = await import('../services/ingestion/runIngestion.js');
  const { createApp } = await import('../server.js');

  await connectDb();
  const count = await Job.countDocuments();
  if (count < 200) {
    console.log(`[dev-stack] only ${count} jobs stored; running ingestion...`);
    const result = await runIngestion({ trigger: 'script' });
    console.log('[dev-stack] ingestion', result.status, result.totals);
  } else {
    console.log(`[dev-stack] found ${count} jobs; skipping ingestion`);
  }

  const app = await createApp();
  app.listen(env.port, () => {
    console.log(`[dev-stack] API on http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
