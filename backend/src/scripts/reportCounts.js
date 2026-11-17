import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_PORT,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const dbPath = ensureFirststepMongoDir();
  const mongod = await MongoMemoryServer.create({
    instance: { port: FIRSTSTEP_MONGO_PORT, dbPath, storageEngine: 'wiredTiger' },
  });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = 'firststep_ai';

  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  const { exportBenchmarkCsv } = await import('../services/evaluation/exportImport.js');

  await connectDb();
  const total = await Job.countDocuments({ status: 'active' });
  const unique = total;
  const bySource = await Job.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const classified = await Job.countDocuments({
    status: 'active',
    'classification.status': 'classified',
  });
  const failed = await Job.countDocuments({
    status: 'active',
    'classification.status': 'failed',
  });
  const fresher = await Job.countDocuments({ status: 'active', fresherEligible: true });
  const intern = await Job.countDocuments({
    status: 'active',
    $or: [{ employmentType: 'Internship' }, { experienceLevel: 'Internship' }],
  });

  let exported = null;
  if (classified > 0) {
    const out = path.resolve(projectRoot, 'evaluation/benchmark.csv');
    exported = await exportBenchmarkCsv(out, { limit: Math.min(50, classified) });
  }

  console.log(
    JSON.stringify(
      {
        total,
        unique,
        bySource,
        classified,
        failed,
        fresherEligible: fresher,
        internships: intern,
        exported,
      },
      null,
      2,
    ),
  );

  await disconnectDb();
  await mongod.stop({ doCleanup: false, force: false });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
