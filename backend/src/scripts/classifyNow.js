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
  process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'firststep_ai';
  if (!process.env.LLM_PROVIDER) process.env.LLM_PROVIDER = 'openai';

  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { PipelineLock } = await import('../models/PipelineLock.js');
  const { Job } = await import('../models/Job.js');
  const { runClassification } = await import('../services/classification/runClassification.js');

  await connectDb();
  const deleted = await PipelineLock.deleteMany({});
  const jobCount = await Job.countDocuments({ status: 'active' });
  console.log({ deletedLocks: deleted.deletedCount, jobCount, provider: process.env.LLM_PROVIDER });

  const limit = Number(process.env.CLASSIFY_LIMIT || 50);
  const result = await runClassification({ trigger: 'script', limit, force: false });
  console.log(JSON.stringify(result, null, 2));

  await disconnectDb();
  await mongod.stop({ doCleanup: false, force: false });
  if (!result.ok && result.status !== 'locked') process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
