/**
 * Score india_benchmark_50.csv (AI vs human) with the same metric rules as
 * services/evaluation/metrics.js, and upsert EvaluationLabel docs for import.
 *
 * Usage: node src/scripts/scoreIndiaBenchmark.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { computeEvaluationMetrics } from '../services/evaluation/metrics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const csvPath = path.join(root, 'evaluation/india_benchmark_50.csv');
const reportPath = path.join(root, 'evaluation/INDIA_BENCHMARK_ACCURACY.md');

function parseCsv(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      current.push(field);
      field = '';
    } else if (ch === '\n') {
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field.length || current.length) {
    current.push(field);
    rows.push(current);
  }
  return rows;
}

function parseFresher(raw) {
  const t = String(raw ?? '').trim();
  if (t === '') return null;
  if (t.toLowerCase() === 'true') return true;
  if (t.toLowerCase() === 'false') return false;
  return null;
}

function rowToMetricShape(cells, idx) {
  const humanFresher = parseFresher(cells[idx.humanFresherEligible]);
  const aiFresher = parseFresher(cells[idx.aiFresherEligible]);
  return {
    evaluationStatus: cells[idx.evaluationStatus] || 'pending',
    humanRole: cells[idx.humanRole]?.trim() || undefined,
    humanCities: cells[idx.humanCity]
      ? cells[idx.humanCity]
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
      : [],
    humanExperience: cells[idx.humanExperience]?.trim() || undefined,
    humanFresherEligible: humanFresher,
    aiRole: cells[idx.aiRole]?.trim() || undefined,
    aiCities: cells[idx.aiCity]
      ? cells[idx.aiCity]
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
      : [],
    aiExperience: cells[idx.aiExperience]?.trim() || undefined,
    aiFresherEligible: aiFresher,
  };
}

function mismatches(table, idx) {
  const out = { role: [], city: [], experience: [], fresher: [] };
  for (let i = 1; i < table.length; i += 1) {
    const r = rowToMetricShape(table[i], idx);
    if (r.evaluationStatus !== 'labeled') continue;
    const company = table[i][idx.company];
    const title = table[i][idx.jobTitle];
    if (r.humanRole !== r.aiRole) out.role.push({ row: i, company, title, human: r.humanRole, ai: r.aiRole });
    const hCity = [...r.humanCities].sort().join('|');
    const aCity = [...r.aiCities].sort().join('|');
    if (hCity && hCity !== aCity) out.city.push({ row: i, company, title, human: hCity || '(blank)', ai: aCity || '(blank)' });
    if (r.humanExperience !== r.aiExperience) {
      out.experience.push({ row: i, company, title, human: r.humanExperience, ai: r.aiExperience });
    }
    const frOk =
      r.humanFresherEligible === r.aiFresherEligible ||
      (r.humanFresherEligible == null && r.aiFresherEligible == null);
    if (!frOk) {
      out.fresher.push({
        row: i,
        company,
        title,
        human: r.humanFresherEligible == null ? 'null' : String(r.humanFresherEligible),
        ai: r.aiFresherEligible == null ? 'null' : String(r.aiFresherEligible),
      });
    }
  }
  return out;
}

async function main() {
  const text = fs.readFileSync(csvPath, 'utf8');
  const table = parseCsv(text);
  const header = table[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  const metricRows = table.slice(1).map((cells) => rowToMetricShape(cells, idx));
  const metrics = computeEvaluationMetrics(metricRows);
  const miss = mismatches(table, idx);

  // Upsert EvaluationLabel from India CSV so DB import path stays consistent.
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { EvaluationLabel } = await import('../models/EvaluationLabel.js');
  await connectDb();

  const indiaIds = [];
  let upserted = 0;
  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i];
    const jobId = cells[idx.jobId];
    if (!jobId) continue;
    indiaIds.push(jobId);
    const shape = rowToMetricShape(cells, idx);
    await EvaluationLabel.findOneAndUpdate(
      { jobId },
      {
        jobId,
        originalTitle: cells[idx.jobTitle],
        company: cells[idx.company],
        originalDescription: (cells[idx.originalDescription] || '').slice(0, 4000),
        aiRole: shape.aiRole,
        aiCities: shape.aiCities,
        aiExperience: shape.aiExperience,
        aiFresherEligible: shape.aiFresherEligible,
        humanRole: shape.humanRole,
        humanCities: shape.humanCities,
        humanExperience: shape.humanExperience,
        humanFresherEligible: shape.humanFresherEligible,
        evaluationStatus: shape.evaluationStatus === 'labeled' ? 'labeled' : 'pending',
      },
      { upsert: true, new: true },
    );
    upserted += 1;
  }

  // Keep EvaluationLabel scoped to this India-50 set so old hand-check rows
  // cannot inflate / dilute reported accuracy.
  const del = await EvaluationLabel.deleteMany({ jobId: { $nin: indiaIds } });
  const dbDocs = await EvaluationLabel.find({ jobId: { $in: indiaIds } }).lean();
  const dbMetrics = computeEvaluationMetrics(dbDocs);
  await disconnectDb();

  const md = [
    '# India benchmark accuracy (50 human-reviewed posts)',
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'Source: `evaluation/india_benchmark_50.csv` scored with `computeEvaluationMetrics` (same rules as evaluation importer).',
    '',
    'Row 3–4 confirmation audit: `evaluation/ROW3_ROW4_AUDIT.md`.',
    '',
    '## Headline metrics',
    '',
    '| Metric | Value | Denominator notes |',
    '| --- | ---: | --- |',
    `| Labeled sample | ${metrics.labeledCount} | Must be 50 |`,
    `| Role accuracy | ${metrics.roleAccuracy}% | / labeled |`,
    `| City accuracy | ${metrics.cityAccuracy}% | / scorable cities (blank human city unscorable) |`,
    `| Experience accuracy | ${metrics.experienceAccuracy}% | / labeled |`,
    `| Fresher-eligibility accuracy | ${metrics.fresherEligibilityAccuracy}% | / labeled (null≠true counts as miss) |`,
    `| Exact-match (all four) | ${metrics.exactMatchAccuracy}% | / labeled |`,
    `| City unscorable | ${metrics.cityUnscorable} | blank human city |`,
    `| City partial overlaps | ${metrics.cityPartialMatches} | not counted correct |`,
    '',
    '## Mismatch counts',
    '',
    `| Field | Mismatches |`,
    `| --- | ---: |`,
    `| Role | ${miss.role.length} |`,
    `| City (among scorable) | ${miss.city.length} |`,
    `| Experience | ${miss.experience.length} |`,
    `| Fresher eligible | ${miss.fresher.length} |`,
    '',
    '## Role mismatches (human → AI)',
    '',
    ...miss.role.map((m) => `- Row ${m.row} ${m.company}: human **${m.human}** vs AI **${m.ai}** — ${m.title}`),
    '',
    '## Experience mismatches',
    '',
    ...miss.experience.map((m) => `- Row ${m.row} ${m.company}: human **${m.human}** vs AI **${m.ai}** — ${m.title}`),
    '',
    '## Fresher mismatches',
    '',
    ...miss.fresher.map((m) => `- Row ${m.row} ${m.company}: human **${m.human}** vs AI **${m.ai}** — ${m.title}`),
    '',
    '## City mismatches (scorable only)',
    '',
    ...miss.city.map((m) => `- Row ${m.row} ${m.company}: human **${m.human}** vs AI **${m.ai}** — ${m.title}`),
    '',
    '## Import',
    '',
    `- EvaluationLabel upserts: ${upserted}`,
    `- Removed non-India-50 EvaluationLabel docs: ${del.deletedCount}`,
    `- DB metrics labeledCount: ${dbMetrics.labeledCount}`,
    `- DB roleAccuracy: ${dbMetrics.roleAccuracy}% (must match CSV)`,
    '',
    '## Integrity notes',
    '',
    '- Exclusions (Vertiv×2, Xylem, weak fills): `BENCHMARK_EXCLUSIONS.md` — not in the 50.',
    '- Do not conflate this with retired regex hand-check figures.',
    '',
  ];

  fs.writeFileSync(reportPath, md.join('\n'), 'utf8');
  console.log(
    JSON.stringify(
      {
        csvMetrics: metrics,
        dbLabeled: dbMetrics.labeledCount,
        mismatchCounts: {
          role: miss.role.length,
          city: miss.city.length,
          experience: miss.experience.length,
          fresher: miss.fresher.length,
        },
        reportPath,
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
