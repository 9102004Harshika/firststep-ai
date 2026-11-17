/**
 * Export up to 50 India-relevant early-career jobs for human labeling.
 * Human columns intentionally blank — never fabricate labels.
 * Balanced across companies, cities, employment types, and sources.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
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

const OVERSEAS_LOC =
  /\b(london|united kingdom|\buk\b|berlin|amsterdam|dublin|lisbon|austin|seattle|san francisco|new york|toronto|sydney|singapore|paris|munich|zurich|belgrade|aarhus|mexico|remote\s*[-–]?\s*(us|usa|europe|emea|uk))\b/i;

const EXPERIENCED_TITLE =
  /\b(senior|staff|principal|director|manager|head of|vp\b|vice president|architect|engineering manager|delivery lead|lead software|software lead)\b/i;

const EARLY_TITLE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program|hire|analyst)|entry[-\s]?level|junior|associate)\b/i;

const AMBIGUOUS_LOC = /^(in[-\s]?office|remote|hybrid|office|n\/?a|unknown)?$/i;

function hasVerifiedIndiaGeo(job) {
  const cities = job.location?.cities || [];
  if (cities.length > 0) return true;
  const raw = String(job.location?.raw || '');
  if (OVERSEAS_LOC.test(raw)) return false;
  if (AMBIGUOUS_LOC.test(raw.trim())) return false;
  return /\b(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida|kolkata|ahmedabad|jaipur|kochi|chandigarh|vadodara|indore|lucknow)\b/i.test(
    raw,
  );
}

function isEligibleBenchmarkJob(job) {
  if (!job?.indiaRelevant) return false;
  if (!hasVerifiedIndiaGeo(job)) return false;
  const title = job.title || '';
  const raw = String(job.location?.raw || '');
  if (OVERSEAS_LOC.test(raw) || OVERSEAS_LOC.test(title)) return false;
  // Experienced titles only allowed if also clearly internship/fresher track.
  if (EXPERIENCED_TITLE.test(title) && !/\b(intern(?:ship)?|fresher|trainee|apprentice|new\s*grad)\b/i.test(title)) {
    return false;
  }
  // Benchmark set requires an explicit early-career title signal (not associate-only mid jobs).
  if (!EARLY_TITLE.test(title)) return false;
  if (/\b(lead|architect)\b/i.test(title) && !/\b(intern(?:ship)?|junior|trainee|fresher)\b/i.test(title)) {
    return false;
  }
  return true;
}

function bucketKey(job) {
  const city = (job.location?.cities || [])[0] || 'UnknownCity';
  const emp =
    job.employmentType === 'Internship' || /\bintern/i.test(job.title || '')
      ? 'Internship'
      : job.experienceLevel === 'Fresher' || /\bfresher|graduate|campus|trainee/i.test(job.title || '')
        ? 'FresherTrack'
        : 'OtherEarly';
  const source = job.source || 'unknown';
  return `${source}|${emp}|${city}`;
}

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  await connectDb();

  const jobsRaw = await Job.find({
    status: 'active',
    indiaRelevant: true,
    $or: earlyOr,
  })
    .sort({ postedAt: -1, lastSeenAt: -1 })
    .limit(800)
    .lean();

  const jobs = jobsRaw.filter(isEligibleBenchmarkJob);

  const perCompany = new Map();
  const perBucket = new Map();
  const selected = [];

  // Pass 1: prefer classified jobs for AI columns, keep diversity.
  const ranked = [
    ...jobs.filter((j) => j.classification?.status === 'classified'),
    ...jobs.filter((j) => j.classification?.status !== 'classified'),
  ];

  // Seed with LinkedIn early posts for source diversity (if present).
  for (const job of ranked.filter((j) => j.source === 'linkedin')) {
    const company = job.company || 'Unknown';
    if ((perCompany.get(company) || 0) >= 2) continue;
    perCompany.set(company, (perCompany.get(company) || 0) + 1);
    perBucket.set(bucketKey(job), (perBucket.get(bucketKey(job)) || 0) + 1);
    selected.push(job);
    if (selected.length >= 12) break;
  }

  for (const job of ranked) {
    if (selected.some((j) => String(j._id) === String(job._id))) continue;
    const company = job.company || 'Unknown';
    if ((perCompany.get(company) || 0) >= 2) continue;
    const bucket = bucketKey(job);
    if ((perBucket.get(bucket) || 0) >= 3) continue;

    perCompany.set(company, (perCompany.get(company) || 0) + 1);
    perBucket.set(bucket, (perBucket.get(bucket) || 0) + 1);
    selected.push(job);
    if (selected.length >= 50) break;
  }

  // Pass 2: fill remaining slots with company cap only.
  if (selected.length < 50) {
    const selectedIds = new Set(selected.map((j) => String(j._id)));
    for (const job of ranked) {
      if (selectedIds.has(String(job._id))) continue;
      const company = job.company || 'Unknown';
      if ((perCompany.get(company) || 0) >= 3) continue;
      perCompany.set(company, (perCompany.get(company) || 0) + 1);
      selected.push(job);
      selectedIds.add(String(job._id));
      if (selected.length >= 50) break;
    }
  }

  const header = [
    'jobId',
    'source',
    'company',
    'jobTitle',
    'originalLocation',
    'originalDescription',
    'jobUrl',
    'aiRole',
    'aiCity',
    'aiExperience',
    'aiFresherEligible',
    'aiEvidence',
    'humanRole',
    'humanCity',
    'humanExperience',
    'humanFresherEligible',
    'humanRoleEvidence',
    'humanCityEvidence',
    'humanExperienceEvidence',
    'humanFresherEvidence',
    'evaluationStatus',
    'promptVersion',
    'provider',
    'model',
  ];

  const lines = [header.join(',')];
  for (const job of selected) {
    lines.push(
      [
        job._id,
        csvEscape(job.source),
        csvEscape(job.company),
        csvEscape(job.title),
        csvEscape(job.location?.raw || ''),
        csvEscape((job.description || '').slice(0, 4000)),
        csvEscape(job.jobUrl || ''),
        csvEscape(job.role || 'Unknown'),
        csvEscape((job.location?.cities || []).join('|')),
        csvEscape(job.experienceLevel || 'Unknown'),
        job.fresherEligible == null ? '' : String(job.fresherEligible),
        csvEscape(job.classification?.evidence || ''),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'pending',
        csvEscape(job.classification?.promptVersion || ''),
        csvEscape(job.classification?.provider || ''),
        csvEscape(job.classification?.model || ''),
      ].join(','),
    );
  }

  const outCsv = path.join(root, 'evaluation/india_benchmark_50.csv');
  await fs.writeFile(outCsv, `${lines.join('\n')}\n`, 'utf8');

  const worksheetLines = [
    '# India benchmark annotation worksheet (50 posts)',
    '',
    'Human labels are intentionally blank. Fill them yourself — do not copy AI columns.',
    '',
    'Machine CSV: `evaluation/india_benchmark_50.csv`',
    '',
    '| # | Company | Title | Source | Location | Emp/Exp hint | AI role | Human role | Human city | Human exp | Human fresher | Evidence notes |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  selected.forEach((job, idx) => {
    const hint = [
      job.employmentType || '',
      job.experienceLevel || '',
      job.fresherEligible == null ? '' : `fresher=${job.fresherEligible}`,
    ]
      .filter(Boolean)
      .join(' / ');
    worksheetLines.push(
      `| ${idx + 1} | ${job.company || ''} | ${String(job.title || '').replace(/\|/g, '/')} | ${job.source || ''} | ${String(job.location?.raw || '').replace(/\|/g, '/')} | ${hint.replace(/\|/g, '/')} | ${job.role || 'Unknown'} |  |  |  |  |  |`,
    );
  });

  worksheetLines.push(
    '',
    '## Review checklist',
    '',
    '1. Open the original `jobUrl` from the CSV for each row.',
    '2. Label role / city / experience / fresher eligibility from the posting text only.',
    '3. Write short evidence snippets in the `human*Evidence` CSV columns.',
    '4. Mark `evaluationStatus=labeled` only after all four human fields are reviewed.',
    '5. Calculate accuracy only after import — never invent accuracy numbers.',
    '',
  );

  const outMd = path.join(root, 'evaluation/INDIA_BENCHMARK_WORKSHEET.md');
  await fs.writeFile(outMd, worksheetLines.join('\n'), 'utf8');

  console.log(
    JSON.stringify(
      {
        csv: outCsv,
        worksheet: outMd,
        count: selected.length,
        companies: perCompany.size,
        buckets: perBucket.size,
        sources: [...new Set(selected.map((j) => j.source))],
        classifiedAmongSelected: selected.filter((j) => j.classification?.status === 'classified')
          .length,
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
