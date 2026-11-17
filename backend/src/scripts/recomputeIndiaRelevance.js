/**
 * Re-evaluate indiaRelevant for all active jobs after geography rule changes.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  const { evaluateIndiaGeography, normalizeCityName } = await import(
    '../utils/indiaRelevance.js'
  );

  await connectDb();
  const jobs = await Job.find({ status: 'active' }).select({
    title: 1,
    company: 1,
    description: 1,
    'location.raw': 1,
    indiaRelevant: 1,
  });

  let flippedOff = 0;
  let flippedOn = 0;
  let unchanged = 0;

  for (const job of jobs) {
    const geo = evaluateIndiaGeography({
      locationRaw: job.location?.raw || '',
      description: job.description || '',
      title: job.title || '',
      company: job.company || '',
    });
    const cities = [...new Set((geo.cities || []).map(normalizeCityName).filter(Boolean))];
    const before = Boolean(job.indiaRelevant);
    const after = Boolean(geo.indiaRelevant);

    if (before === after) {
      unchanged += 1;
      // Still refresh evidence/cities for consistency
      job.location = job.location || {};
      job.location.cities = cities;
      job.location.country = geo.country || job.location.country;
      job.geographicEvidence = geo.geographicEvidence;
      job.geoExclusionReason = geo.exclusionReason || null;
      await job.save();
      continue;
    }

    job.indiaRelevant = after;
    job.location = job.location || {};
    job.location.cities = cities;
    job.location.country = geo.country || 'Unknown';
    job.geographicEvidence = geo.geographicEvidence;
    job.geoExclusionReason = geo.exclusionReason || null;
    await job.save();

    if (before && !after) flippedOff += 1;
    if (!before && after) flippedOn += 1;
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

  const [india, early] = await Promise.all([
    Job.countDocuments({ status: 'active', indiaRelevant: true }),
    Job.countDocuments({ status: 'active', indiaRelevant: true, $or: earlyOr }),
  ]);

  console.log(
    JSON.stringify(
      {
        scanned: jobs.length,
        unchanged,
        flippedOff,
        flippedOn,
        indiaRelevantActive: india,
        earlyCareerIndia: early,
        pass200: early >= 200,
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
