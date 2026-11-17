import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_PORT,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

const EARLY_RE =
  /\b(intern|internship|fresher|graduate|campus|trainee|apprentice|entry[-\s]?level|junior|new\s*grad|university\s*grad|0-1\s*year|0–1\s*year)\b/i;

async function main() {
  const dbPath = ensureFirststepMongoDir();
  const mongod = await MongoMemoryServer.create({
    instance: { port: FIRSTSTEP_MONGO_PORT, dbPath, storageEngine: 'wiredTiger' },
  });
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = 'firststep_ai';

  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  const { extractIndianCities, isIndiaRelevant } = await import('../utils/cities.js');

  await connectDb();
  const jobs = await Job.find({ status: 'active' });
  let early = 0;
  let india = 0;
  let taggedFresher = 0;

  for (const job of jobs) {
    const blob = `${job.title} ${job.location?.raw || ''} ${job.description || ''}`;
    const indiaRelevant =
      job.indiaRelevant ||
      isIndiaRelevant({
        locationRaw: job.location?.raw,
        description: job.description,
        company: job.company,
      });
    const cities = [
      ...new Set([
        ...(job.location?.cities || []),
        ...extractIndianCities(`${job.location?.raw || ''} ${job.title}`),
      ]),
    ];
    const isEarly = EARLY_RE.test(blob) || job.employmentType === 'Internship' || job.experienceLevel === 'Internship' || job.experienceLevel === 'Fresher';

    let dirty = false;
    if (indiaRelevant && !job.indiaRelevant) {
      job.indiaRelevant = true;
      dirty = true;
    }
    if (cities.length && (!job.location.cities || job.location.cities.length === 0)) {
      job.location.cities = cities;
      if (job.location.country === 'Unknown') job.location.country = 'India';
      dirty = true;
    }

    if (isEarly) {
      early += 1;
      if (job.experienceLevel === 'Unknown') {
        job.experienceLevel = /\bintern/i.test(blob) ? 'Internship' : 'Fresher';
        dirty = true;
      }
      if (job.employmentType === 'Unknown' && /\bintern/i.test(blob)) {
        job.employmentType = 'Internship';
        dirty = true;
      }
      // Heuristic fresher eligibility for clearly early-career titles (LLM can refine later)
      if (job.fresherEligible == null && (indiaRelevant || cities.length)) {
        job.fresherEligible = true;
        taggedFresher += 1;
        dirty = true;
      }
    }

    if (indiaRelevant) india += 1;
    if (dirty) await job.save();
  }

  const stats = {
    total: jobs.length,
    indiaRelevant: india,
    earlyCareerSignals: early,
    fresherEligibleNow: await Job.countDocuments({ status: 'active', fresherEligible: true }),
    internships: await Job.countDocuments({
      status: 'active',
      $or: [{ employmentType: 'Internship' }, { experienceLevel: 'Internship' }],
    }),
    indiaEarly: await Job.countDocuments({
      status: 'active',
      indiaRelevant: true,
      $or: [
        { fresherEligible: true },
        { employmentType: 'Internship' },
        { experienceLevel: { $in: ['Internship', 'Fresher', 'Entry Level'] } },
      ],
    }),
  };

  console.log(JSON.stringify(stats, null, 2));
  await disconnectDb();
  await mongod.stop({ doCleanup: false, force: false });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
