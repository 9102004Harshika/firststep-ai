import { connectDb, disconnectDb } from '../config/db.js';
import { fetchJobsForSource } from '../services/ingestion/adapters/index.js';
import { normalizeJob } from '../services/ingestion/normalization/normalizeJob.js';
import { upsertNormalizedJobs } from '../services/ingestion/deduplication/upsertJobs.js';
import { Job } from '../models/Job.js';

const TITLE_EARLY =
  /\b(intern|internship|fresher|graduate|campus|trainee|apprentice|entry[-\s]?level|junior|new\s*grad|university)\b/i;
const TITLE_SENIOR =
  /\b(senior|staff|principal|lead|manager|director|head|architect|vp|chief)\b/i;

const sources = [
  {
    employer: 'HighRadius',
    provider: 'greenhouse',
    boardId: 'highradius',
    countryRelevance: 'india',
    enabled: true,
  },
  {
    employer: 'Druva',
    provider: 'greenhouse',
    boardId: 'druva',
    countryRelevance: 'india',
    enabled: true,
  },
];

async function main() {
  await connectDb();
  for (const source of sources) {
    const raw = await fetchJobsForSource(source);
    const normalized = raw.map((job) => normalizeJob(job));
    const stats = await upsertNormalizedJobs(normalized);
    console.log(source.boardId, { fetched: raw.length, ...stats });
  }

  const jobs = await Job.find({
    status: 'active',
    sourceBoard: { $in: ['highradius', 'druva'] },
  });
  for (const job of jobs) {
    const title = job.title || '';
    const should =
      (TITLE_EARLY.test(title) ||
        job.employmentType === 'Internship' ||
        job.experienceLevel === 'Internship') &&
      !TITLE_SENIOR.test(title);
    if (should) {
      job.fresherEligible = true;
      if (job.experienceLevel === 'Unknown') {
        job.experienceLevel = /\bintern/i.test(title) ? 'Internship' : 'Fresher';
      }
      await job.save();
    }
  }

  const early = await Job.countDocuments({
    status: 'active',
    $and: [
      {
        $or: [
          { fresherEligible: true },
          { employmentType: 'Internship' },
          { experienceLevel: { $in: ['Internship', 'Fresher'] } },
          {
            title: {
              $regex:
                '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level)\\b',
              $options: 'i',
            },
          },
        ],
      },
      {
        title: {
          $not: {
            $regex: '\\b(senior|staff|principal|director|head of|\\bvp\\b|chief|delivery lead)\\b',
            $options: 'i',
          },
        },
      },
    ],
  });

  console.log({
    fresherEligible: await Job.countDocuments({ status: 'active', fresherEligible: true }),
    earlyCareerFiltered: early,
  });
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
