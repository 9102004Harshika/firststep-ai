/**
 * Reproducible Atlas inventory → docs/FINAL_DATA_INVENTORY.md + JSON
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import dns from 'node:dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
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

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  await connectDb();

  const generatedAt = new Date().toISOString();
  const [
    totalRecords,
    uniqueActive,
    indiaActive,
    fresherEligible,
    internships,
    unknownGeo,
    earlyIndia,
    classifiedIndia,
    unknownRoleIndia,
    failedClass,
    pendingClass,
  ] = await Promise.all([
    Job.countDocuments({}),
    Job.countDocuments({ status: 'active' }),
    Job.countDocuments({ status: 'active', indiaRelevant: true }),
    Job.countDocuments({ status: 'active', indiaRelevant: true, fresherEligible: true }),
    Job.countDocuments({
      status: 'active',
      indiaRelevant: true,
      $or: [{ employmentType: 'Internship' }, { experienceLevel: 'Internship' }],
    }),
    Job.countDocuments({
      status: 'active',
      $or: [
        { 'location.country': { $in: ['Unknown', 'Remote', 'Overseas'] } },
        { indiaRelevant: false },
      ],
    }),
    Job.countDocuments({ status: 'active', indiaRelevant: true, $or: earlyOr }),
    Job.countDocuments({
      status: 'active',
      indiaRelevant: true,
      'classification.status': 'classified',
    }),
    Job.countDocuments({
      status: 'active',
      indiaRelevant: true,
      role: 'Unknown',
    }),
    Job.countDocuments({ status: 'active', 'classification.status': 'failed' }),
    Job.countDocuments({
      status: 'active',
      $or: [
        { 'classification.status': 'pending' },
        { 'classification.status': { $exists: false } },
      ],
    }),
  ]);

  const byCity = await Job.aggregate([
    { $match: { status: 'active', indiaRelevant: true } },
    { $unwind: { path: '$location.cities', preserveNullAndEmptyArrays: false } },
    { $group: { _id: '$location.cities', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 25 },
  ]);

  const byRole = await Job.aggregate([
    { $match: { status: 'active', indiaRelevant: true } },
    { $group: { _id: '$role', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);

  const bySource = await Job.aggregate([
    { $match: { status: 'active', indiaRelevant: true } },
    { $group: { _id: '$source', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);

  const byEmployer = await Job.aggregate([
    { $match: { status: 'active', indiaRelevant: true } },
    { $group: { _id: '$company', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 30 },
  ]);

  const dupFingerprints = await Job.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$fingerprint', n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $count: 'groups' },
  ]);

  const report = {
    generatedAt,
    database: process.env.MONGODB_DB_NAME || 'firststep_ai',
    // Never include URI / credentials
    counts: {
      totalRecords,
      uniqueActive,
      indiaRelevantActive: indiaActive,
      meets200IndiaRelevant: indiaActive >= 200,
      earlyCareerIndia: earlyIndia,
      fresherEligibleIndia: fresherEligible,
      internshipIndia: internships,
      nonIndiaOrUnknownGeoActive: unknownGeo,
      classifiedIndia,
      unknownRoleAmongIndia: unknownRoleIndia,
      classificationFailed: failedClass,
      classificationPending: pendingClass,
      duplicateFingerprintGroups: dupFingerprints[0]?.groups || 0,
    },
    byCity: byCity.map((r) => ({ city: r._id, count: r.n })),
    byRole: byRole.map((r) => ({ role: r._id || 'Unknown', count: r.n })),
    bySource: bySource.map((r) => ({ source: r._id, count: r.n })),
    byEmployer: byEmployer.map((r) => ({ employer: r._id, count: r.n })),
    notes: [
      'Fetched/updated ingestion totals are NOT unique job counts.',
      'indiaRelevantActive is the Beep 200+ uniqueness check used here.',
      'earlyCareerIndia is a stricter product subset and may be < 200.',
    ],
  };

  const jsonPath = path.join(root, 'docs/FINAL_DATA_INVENTORY.json');
  const mdPath = path.join(root, 'docs/FINAL_DATA_INVENTORY.md');
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), 'utf8');

  const md = `# Final data inventory

**Generated:** ${generatedAt}  
**Database:** \`${report.database}\` (Atlas — credentials not included)

## Headline counts

| Metric | Count | Status |
| --- | ---: | --- |
| Total DB records | ${totalRecords} | measured |
| Unique active jobs | ${uniqueActive} | measured |
| **India-relevant active** | **${indiaActive}** | ${indiaActive >= 200 ? '**PASS (≥200)**' : '**FAIL (<200)**'} |
| Early-career ∩ India | ${earlyIndia} | measured (not the 200 gate) |
| Fresher-eligible ∩ India | ${fresherEligible} | measured |
| Internship ∩ India | ${internships} | measured |
| Active non-India / unknown-geo bucket | ${unknownGeo} | measured |
| Classified ∩ India | ${classifiedIndia} | measured |
| Unknown role ∩ India | ${unknownRoleIndia} | measured |
| Classification failed (all active) | ${failedClass} | measured |
| Classification pending (all active) | ${pendingClass} | measured |
| Duplicate fingerprint groups | ${report.counts.duplicateFingerprintGroups} | measured |

## By source (India-relevant active)

| Source | Count |
| --- | ---: |
${bySource.map((r) => `| ${r._id} | ${r.n} |`).join('\n')}

## By role (India-relevant active)

| Role | Count |
| --- | ---: |
${byRole.map((r) => `| ${r._id || 'Unknown'} | ${r.n} |`).join('\n')}

## Top cities (India-relevant active)

| City | Count |
| --- | ---: |
${byCity.map((r) => `| ${r._id} | ${r.n} |`).join('\n')}

## Top employers (India-relevant active)

| Employer | Count |
| --- | ---: |
${byEmployer.map((r) => `| ${r._id} | ${r.n} |`).join('\n')}

## Method

\`\`\`bash
node backend/src/scripts/finalInventoryReport.js
\`\`\`

Machine-readable twin: \`docs/FINAL_DATA_INVENTORY.json\`.
`;

  await fs.writeFile(mdPath, md, 'utf8');
  console.log(JSON.stringify(report.counts, null, 2));
  console.log(`wrote ${mdPath}`);
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
