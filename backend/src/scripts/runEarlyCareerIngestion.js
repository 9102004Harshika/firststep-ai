/**
 * Targeted ingestion for early-career India expansion sources.
 * Runs LinkedIn discovery + boards flagged in the early-career scan,
 * without re-fetching the entire global Greenhouse fleet.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const EARLY_GH = new Set(
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../tmp/greenhouse_india_early_scan.json'), 'utf8'),
  ).earlyHits.map((x) => x.token),
);
const EARLY_ASHBY = new Set(
  JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../tmp/ashby_india_early_scan.json'), 'utf8'),
  ).hits.filter((x) => x.early > 0).map((x) => x.token),
);
const EXTRA_LEVER = new Set(['pattern', 'cred', 'meesho', 'mindtickle']);
const EXTRA_SR = new Set(['Endava', 'IXIGO', 'Unacademy', 'Cars24']);
const EXTRA_GH = new Set([
  'hackerrank',
  'enterpret',
  'agoda',
  'headoutcareers',
  'coursera',
  ...EARLY_GH,
]);

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { getEnabledSources } = await import('../services/ingestion/sourceRegistry.js');
  const { fetchJobsForSource } = await import('../services/ingestion/adapters/index.js');
  const { normalizeJob } = await import('../services/ingestion/normalization/normalizeJob.js');
  const { upsertNormalizedJobs } = await import('../services/ingestion/deduplication/upsertJobs.js');
  const { Job } = await import('../models/Job.js');

  await connectDb();

  const sources = getEnabledSources().filter((s) => {
    if (s.provider === 'linkedin') return true;
    if (s.provider === 'workday') return true;
    if (s.provider === 'greenhouse' && EXTRA_GH.has(s.boardId)) return true;
    if (s.provider === 'ashby' && EARLY_ASHBY.has(s.boardId)) return true;
    if (s.provider === 'lever' && EXTRA_LEVER.has(s.boardId)) return true;
    if (s.provider === 'smartrecruiters' && EXTRA_SR.has(s.boardId)) return true;
    return false;
  });

  console.log(`Targeted sources: ${sources.length}`);

  const totals = {
    fetched: 0,
    valid: 0,
    newRecords: 0,
    updated: 0,
    duplicates: 0,
    rejected: 0,
    failed: 0,
  };

  for (const source of sources) {
    const started = Date.now();
    try {
      const rawJobs = await fetchJobsForSource(source);
      const normalized = rawJobs.map((job) => normalizeJob(job));
      const stats = await upsertNormalizedJobs(normalized);
      totals.fetched += rawJobs.length;
      totals.valid += stats.valid;
      totals.newRecords += stats.newRecords;
      totals.updated += stats.updated;
      totals.duplicates += stats.duplicates;
      totals.rejected += stats.rejected;
      totals.failed += stats.failed;
      console.log(
        JSON.stringify({
          ok: true,
          provider: source.provider,
          boardId: source.boardId,
          fetched: rawJobs.length,
          ...stats,
          durationMs: Date.now() - started,
        }),
      );
    } catch (error) {
      totals.failed += 1;
      console.warn(
        JSON.stringify({
          ok: false,
          provider: source.provider,
          boardId: source.boardId,
          error: error.message,
          durationMs: Date.now() - started,
        }),
      );
    }
  }

  const earlyOr = [
    { fresherEligible: true },
    { employmentType: 'Internship' },
    { experienceLevel: { $in: ['Internship', 'Fresher', 'Entry Level'] } },
    {
      title: {
        $regex:
          '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b',
        $options: 'i',
      },
    },
  ];

  const [india, earlyIndia, bySource] = await Promise.all([
    Job.countDocuments({ status: 'active', indiaRelevant: true }),
    Job.countDocuments({ status: 'active', indiaRelevant: true, $or: earlyOr }),
    Job.aggregate([
      { $match: { status: 'active', indiaRelevant: true, $or: earlyOr } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  console.log(
    JSON.stringify(
      {
        totals,
        indiaRelevantActive: india,
        earlyCareerIndia: earlyIndia,
        earlyBySource: bySource,
        pass200: earlyIndia >= 200,
      },
      null,
      2,
    ),
  );

  await disconnectDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
