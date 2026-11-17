import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_PORT,
  FIRSTSTEP_MONGO_URI,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

const TITLE_EARLY =
  /\b(intern|internship|fresher|graduate|campus|trainee|apprentice|entry[-\s]?level|junior|new\s*grad|university)\b/i;
const TITLE_SENIOR =
  /\b(senior|staff|principal|lead|manager|director|head|architect|vp|chief)\b/i;

async function main() {
  // Prefer attaching to the dedicated FirstStep instance; spin one up if needed.
  let mongod;
  if (process.env.ATTACH_URI) {
    process.env.MONGODB_URI = process.env.ATTACH_URI;
  } else if (!process.env.MONGODB_URI?.includes(`:${FIRSTSTEP_MONGO_PORT}`)) {
    const dbPath = ensureFirststepMongoDir();
    mongod = await MongoMemoryServer.create({
      instance: { port: FIRSTSTEP_MONGO_PORT, dbPath, storageEngine: 'wiredTiger' },
    });
    process.env.MONGODB_URI = mongod.getUri();
  } else {
    process.env.MONGODB_URI = process.env.MONGODB_URI || FIRSTSTEP_MONGO_URI;
  }
  process.env.MONGODB_DB_NAME = 'firststep_ai';

  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');

  await connectDb();
  const jobs = await Job.find({ status: 'active' });
  let kept = 0;
  let cleared = 0;

  for (const job of jobs) {
    const title = job.title || '';
    const isEarlyTitle = TITLE_EARLY.test(title);
    const isSeniorTitle = TITLE_SENIOR.test(title);
    const isInternType =
      job.employmentType === 'Internship' || job.experienceLevel === 'Internship';

    const shouldBeFresher = (isEarlyTitle || isInternType) && !isSeniorTitle;

    if (shouldBeFresher) {
      if (job.fresherEligible !== true) {
        job.fresherEligible = true;
        if (job.experienceLevel === 'Unknown') {
          job.experienceLevel = /\bintern/i.test(title) ? 'Internship' : 'Fresher';
        }
        await job.save();
      }
      kept += 1;
    } else if (job.fresherEligible === true) {
      job.fresherEligible = false;
      await job.save();
      cleared += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        keptFresher: kept,
        clearedFalsePositives: cleared,
        fresherEligible: await Job.countDocuments({ status: 'active', fresherEligible: true }),
        internships: await Job.countDocuments({
          status: 'active',
          $or: [{ employmentType: 'Internship' }, { experienceLevel: 'Internship' }],
        }),
      },
      null,
      2,
    ),
  );

  await disconnectDb();
  if (mongod) await mongod.stop({ doCleanup: false, force: false });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
