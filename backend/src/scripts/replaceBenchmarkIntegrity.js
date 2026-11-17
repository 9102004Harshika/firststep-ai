/**
 * Exclude benchmark rows with title/location vs JD integrity failures
 * and replace with other verified India early-career jobs.
 * Preserves already human-labeled rows.
 *
 * Usage: node src/scripts/replaceBenchmarkIntegrity.js
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const csvPath = path.join(root, 'evaluation/india_benchmark_50.csv');
const worksheetPath = path.join(root, 'evaluation/INDIA_BENCHMARK_WORKSHEET.md');
const exclusionLogPath = path.join(root, 'evaluation/BENCHMARK_EXCLUSIONS.md');

// Strict early-career title — do not treat bare "associate" as enough.
const STRICT_EARLY_TITLE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program|hire|analyst)|entry[-\s]?level|junior)\b/i;

const EXPERIENCED_TITLE =
  /\b(senior|staff|principal|director|manager|head of|vp\b|vice president|architect|engineering manager|delivery lead)\b/i;

const OVERSEAS_LOC =
  /\b(london|united kingdom|\buk\b|berlin|amsterdam|dublin|lisbon|austin|seattle|san francisco|new york|toronto|sydney|singapore|paris|munich|zurich|belgrade|aarhus|mexico|remote\s*[-–]?\s*(us|usa|europe|emea|uk)|apac)\b/i;

const US_JD_MARKERS =
  /\b(401k|401\(k\)|profit sharing|veterans with technical backgrounds|motor vehicle records|PTO\/Vacation Plan)\b/i;

const BATTERY_SPECIALIST_BODY = /\bBattery Specialist\b/i;

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && n === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.length && r.some((x) => String(x).trim() !== ''));
}

function rowToObj(header, cells) {
  const obj = {};
  header.forEach((h, i) => {
    obj[h] = cells[i] ?? '';
  });
  return obj;
}

function hasIntegrityFailure(row) {
  const title = row.jobTitle || '';
  const loc = row.originalLocation || '';
  const desc = row.originalDescription || '';
  const reasons = [];

  if (BATTERY_SPECIALIST_BODY.test(desc) && !/battery specialist/i.test(title)) {
    reasons.push('title_desc_role_mismatch: Battery Specialist body under non-Battery title');
  }
  if (
    /\bmecha/i.test(title) &&
    /\b(chemical processes?|manufacturing chemicals|chemical process engineering)\b/i.test(desc)
  ) {
    reasons.push('title_desc_role_mismatch: Mechanical title with chemical-process R&D body');
  }
  if (US_JD_MARKERS.test(desc) && /\b(india|chennai|pune|mumbai|bengaluru|bangalore|hyderabad|vadodara|indore|kolkata|gurugram|delhi)\b/i.test(loc)) {
    reasons.push('us_benefits_boilerplate_on_india_location_post');
  }
  // Drop accidental weak fills (associate-manager / APAC CSM) from a prior replace pass.
  if (
    String(row.evaluationStatus).toLowerCase() !== 'labeled' &&
    EXPERIENCED_TITLE.test(title) &&
    !/\b(intern(?:ship)?|fresher|trainee|apprentice|new\s*grad|junior|graduate)\b/i.test(title)
  ) {
    reasons.push('experienced_title_without_early_signal');
  }
  return reasons;
}

function isCoherentCandidate(job) {
  const title = job.title || '';
  const raw = String(job.location?.raw || '');
  const desc = job.description || '';
  if (!job.indiaRelevant) return false;
  if (!STRICT_EARLY_TITLE.test(title)) return false;
  if (EXPERIENCED_TITLE.test(title) && !/\b(intern(?:ship)?|fresher|trainee|apprentice|new\s*grad)\b/i.test(title)) {
    return false;
  }
  if (OVERSEAS_LOC.test(raw) || OVERSEAS_LOC.test(title)) return false;
  if (!/\b(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida|kolkata|ahmedabad|jaipur|kochi|chandigarh|vadodara|indore|lucknow|hoskote|bawal|tamil nadu|maharashtra|karnataka|haryana|gujarat|west bengal|madhya pradesh)\b/i.test(raw)) {
    return false;
  }
  if (BATTERY_SPECIALIST_BODY.test(desc) && !/battery specialist/i.test(title)) return false;
  if (
    /\bmecha/i.test(title) &&
    /\b(chemical processes?|manufacturing chemicals|chemical process engineering)\b/i.test(desc)
  ) {
    return false;
  }
  if (US_JD_MARKERS.test(desc)) return false;
  // Require some overlap between title tokens and description when desc is long enough.
  if (desc.length > 200) {
    const titleTokens = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 3 && !['engineer', 'graduate', 'trainee', 'diploma', 'field', 'with', 'from'].includes(t));
    const descL = desc.toLowerCase();
    const hits = titleTokens.filter((t) => descL.includes(t));
    if (titleTokens.length >= 2 && hits.length === 0) return false;
  }
  return true;
}

function jobToCsvRow(job, header) {
  const obj = {
    jobId: String(job._id),
    source: job.source || '',
    company: job.company || '',
    jobTitle: job.title || '',
    originalLocation: job.location?.raw || '',
    originalDescription: (job.description || '').slice(0, 4000),
    jobUrl: job.jobUrl || '',
    aiRole: job.role || 'Unknown',
    aiCity: (job.location?.cities || []).join('|'),
    aiExperience: job.experienceLevel || 'Unknown',
    aiFresherEligible: job.fresherEligible == null ? '' : String(job.fresherEligible),
    aiEvidence: job.classification?.evidence || '',
    humanRole: '',
    humanCity: '',
    humanExperience: '',
    humanFresherEligible: '',
    humanRoleEvidence: '',
    humanCityEvidence: '',
    humanExperienceEvidence: '',
    humanFresherEvidence: '',
    evaluationStatus: 'pending',
    promptVersion: job.classification?.promptVersion || '',
    provider: job.classification?.provider || '',
    model: job.classification?.model || '',
  };
  return header.map((h) => csvEscape(obj[h]));
}

async function main() {
  const text = await fs.readFile(csvPath, 'utf8');
  const table = parseCsv(text);
  const header = table[0];
  const rows = table.slice(1).map((cells) => rowToObj(header, cells));

  const excluded = [];
  const kept = [];

  for (const row of rows) {
    if (String(row.evaluationStatus).toLowerCase() === 'labeled') {
      kept.push(row);
      continue;
    }
    const reasons = hasIntegrityFailure(row);
    if (reasons.length) {
      excluded.push({
        jobId: row.jobId,
        company: row.company,
        jobTitle: row.jobTitle,
        jobUrl: row.jobUrl,
        reasons,
      });
      continue;
    }
    kept.push(row);
  }

  const need = 50 - kept.length;
  const keepIds = new Set(kept.map((r) => String(r.jobId)));
  const excludedIds = new Set(excluded.map((e) => String(e.jobId)));

  let replacements = [];
  if (need > 0) {
    const { connectDb, disconnectDb } = await import('../config/db.js');
    const { Job } = await import('../models/Job.js');
    await connectDb();

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

    const candidates = await Job.find({
      status: 'active',
      indiaRelevant: true,
      $or: earlyOr,
    })
      .sort({ postedAt: -1, lastSeenAt: -1 })
      .limit(1200)
      .lean();

    const companyCount = new Map();
    for (const r of kept) {
      companyCount.set(r.company || 'Unknown', (companyCount.get(r.company || 'Unknown') || 0) + 1);
    }

    for (const job of candidates) {
      if (replacements.length >= need) break;
      const id = String(job._id);
      if (keepIds.has(id) || excludedIds.has(id)) continue;
      if (!isCoherentCandidate(job)) continue;
      const company = job.company || 'Unknown';
      if ((companyCount.get(company) || 0) >= 3) continue;
      companyCount.set(company, (companyCount.get(company) || 0) + 1);
      replacements.push(job);
      keepIds.add(id);
    }

    await disconnectDb();
  }

  if (replacements.length < need) {
    throw new Error(
      `Need ${need} replacements but only found ${replacements.length} coherent India early-career candidates`,
    );
  }

  const finalRows = [
    ...kept,
    ...replacements.map((job) => {
      const cells = jobToCsvRow(job, header);
      return rowToObj(
        header,
        cells.map((c) => {
          // un-escape for object form is awkward; rebuild from job instead
          return c;
        }),
      );
    }),
  ];

  // Rebuild finalRows properly for replacements
  const finalObjs = [
    ...kept,
    ...replacements.map((job) => ({
      jobId: String(job._id),
      source: job.source || '',
      company: job.company || '',
      jobTitle: job.title || '',
      originalLocation: job.location?.raw || '',
      originalDescription: (job.description || '').slice(0, 4000),
      jobUrl: job.jobUrl || '',
      aiRole: job.role || 'Unknown',
      aiCity: (job.location?.cities || []).join('|'),
      aiExperience: job.experienceLevel || 'Unknown',
      aiFresherEligible: job.fresherEligible == null ? '' : String(job.fresherEligible),
      aiEvidence: job.classification?.evidence || '',
      humanRole: '',
      humanCity: '',
      humanExperience: '',
      humanFresherEligible: '',
      humanRoleEvidence: '',
      humanCityEvidence: '',
      humanExperienceEvidence: '',
      humanFresherEvidence: '',
      evaluationStatus: 'pending',
      promptVersion: job.classification?.promptVersion || '',
      provider: job.classification?.provider || '',
      model: job.classification?.model || '',
    })),
  ];

  if (finalObjs.length !== 50) {
    throw new Error(`Expected 50 rows, got ${finalObjs.length}`);
  }

  const lines = [
    header.join(','),
    ...finalObjs.map((obj) => header.map((h) => csvEscape(obj[h])).join(',')),
  ];
  await fs.writeFile(csvPath, `${lines.join('\n')}\n`, 'utf8');

  const worksheetLines = [
    '# India benchmark annotation worksheet (50 posts)',
    '',
    'Human labels are intentionally blank. Fill them yourself — do not copy AI columns.',
    '',
    'Machine CSV: `evaluation/india_benchmark_50.csv`',
    '',
    'Integrity note: rows with title/location vs JD country/role mismatch are excluded; see `BENCHMARK_EXCLUSIONS.md`.',
    '',
    '| # | Company | Title | Source | Location | Emp/Exp hint | AI role | Human role | Human city | Human exp | Human fresher | Evidence notes |',
    '| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  finalObjs.forEach((row, idx) => {
    const hint = [row.aiExperience, row.aiFresherEligible === '' ? '' : `fresher=${row.aiFresherEligible}`]
      .filter(Boolean)
      .join(' / ');
    worksheetLines.push(
      `| ${idx + 1} | ${row.company} | ${String(row.jobTitle).replace(/\|/g, '/')} | ${row.source} | ${String(row.originalLocation).replace(/\|/g, '/')} | ${hint.replace(/\|/g, '/')} | ${row.aiRole} | ${row.humanRole} | ${row.humanCity} | ${row.humanExperience} | ${row.humanFresherEligible} |  |`,
    );
  });

  worksheetLines.push(
    '',
    '## Review checklist',
    '',
    '1. Open the original `jobUrl` from the CSV for each row.',
    '2. Label role / city / experience / fresher eligibility from the posting text only.',
    '3. If title/location and JD conflict (different role or country), exclude and replace — do not invent ground truth.',
    '4. Write short evidence snippets in the `human*Evidence` CSV columns.',
    '5. Mark `evaluationStatus=labeled` only after all four human fields are reviewed.',
    '6. Calculate accuracy only after import — never invent accuracy numbers.',
    '',
  );
  await fs.writeFile(worksheetPath, worksheetLines.join('\n'), 'utf8');

  let prior = '';
  try {
    prior = await fs.readFile(exclusionLogPath, 'utf8');
  } catch {
    prior = '';
  }

  const exclusionMd = [
    '# Benchmark exclusions (integrity)',
    '',
    `Updated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Rows removed from `india_benchmark_50.csv` because the original posting could not provide coherent India early-career evidence (title/location vs JD mismatch, or accidental non-early fill).',
    '',
    '| JobId | Company | Title | Reasons | URL |',
    '| --- | --- | --- | --- | --- |',
    ...excluded.map(
      (e) =>
        `| ${e.jobId} | ${e.company} | ${String(e.jobTitle).replace(/\|/g, '/')} | ${e.reasons.join('; ')} | ${e.jobUrl} |`,
    ),
    '',
    '## Replacements added (this run)',
    '',
    ...replacements.map(
      (j, i) =>
        `${i + 1}. **${j.company}** — ${j.title} (${j.location?.raw || ''}) — ${j.jobUrl || '(no url)'}`,
    ),
    '',
    prior.trim()
      ? ['## Prior exclusion log', '', prior.trim(), '']
      : [],
  ].flat();
  await fs.writeFile(exclusionLogPath, exclusionMd.join('\n'), 'utf8');

  // Patch annotation guide with integrity rule
  const guidePath = path.join(root, 'evaluation/ANNOTATION_GUIDE.md');
  let guide = await fs.readFile(guidePath, 'utf8');
  if (!guide.includes('title/location and JD conflict')) {
    guide = guide.replace(
      '5. Fresher eligibility requires explicit evidence (YOE, student, campus, intern). Otherwise leave blank/null.\n',
      '5. Fresher eligibility requires explicit evidence (YOE, student, campus, intern). Otherwise leave blank/null.\n' +
        '6. If title/location and JD conflict (different role or country signals), exclude the row and replace — do not manufacture ground truth from a mismatched description.\n',
    );
    await fs.writeFile(guidePath, guide, 'utf8');
  }

  console.log(
    JSON.stringify(
      {
        excluded: excluded.length,
        replacements: replacements.length,
        labeledPreserved: kept.filter((r) => String(r.evaluationStatus).toLowerCase() === 'labeled').length,
        total: finalObjs.length,
        exclusionLog: exclusionLogPath,
        excludedTitles: excluded.map((e) => e.jobTitle),
        replacementTitles: replacements.map((j) => `${j.company}: ${j.title}`),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
