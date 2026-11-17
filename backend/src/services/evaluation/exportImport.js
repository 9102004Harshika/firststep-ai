import fs from 'node:fs/promises';
import path from 'node:path';
import { Job } from '../../models/Job.js';
import { EvaluationLabel } from '../../models/EvaluationLabel.js';
import { computeEvaluationMetrics } from './metrics.js';

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function exportBenchmarkCsv(filePath, { limit = 50 } = {}) {
  const jobs = await Job.find({
    status: 'active',
    'classification.status': 'classified',
  })
    .sort({ 'classification.classifiedAt': -1 })
    .limit(limit)
    .lean();

  if (!jobs.length) {
    throw new Error('No classified jobs available to export');
  }

  const rows = [];
  for (const job of jobs) {
    const doc = await EvaluationLabel.findOneAndUpdate(
      { jobId: job._id },
      {
        $setOnInsert: {
          jobId: job._id,
          originalTitle: job.title,
          company: job.company,
          originalDescription: (job.description || '').slice(0, 4000),
          aiRole: job.role,
          aiCities: job.location?.cities || [],
          aiExperience: job.experienceLevel,
          aiFresherEligible: job.fresherEligible,
          evaluationStatus: 'pending',
        },
      },
      { upsert: true, new: true },
    );
    rows.push(doc);
  }

  const header = [
    'jobId',
    'originalTitle',
    'company',
    'originalDescription',
    'aiRole',
    'aiCity',
    'aiExperience',
    'aiFresherEligible',
    'humanRole',
    'humanCity',
    'humanExperience',
    'humanFresherEligible',
    'evaluationStatus',
  ];

  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.jobId,
        csvEscape(row.originalTitle),
        csvEscape(row.company),
        csvEscape(row.originalDescription),
        csvEscape(row.aiRole),
        csvEscape((row.aiCities || []).join('|')),
        csvEscape(row.aiExperience),
        row.aiFresherEligible == null ? '' : String(row.aiFresherEligible),
        csvEscape(row.humanRole || ''),
        csvEscape((row.humanCities || []).join('|')),
        csvEscape(row.humanExperience || ''),
        row.humanFresherEligible == null ? '' : String(row.humanFresherEligible),
        row.evaluationStatus,
      ].join(','),
    );
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  return { path: filePath, count: rows.length };
}

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

export async function importBenchmarkCsv(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const table = parseCsv(text);
  if (table.length < 2) throw new Error('CSV has no data rows');

  const header = table[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  let updated = 0;
  for (const row of table.slice(1)) {
    if (!row[idx.jobId]) continue;
    const humanRole = row[idx.humanRole]?.trim() || undefined;
    const humanCity = row[idx.humanCity]?.trim();
    const humanExperience = row[idx.humanExperience]?.trim() || undefined;
    const humanFresherRaw = row[idx.humanFresherEligible]?.trim();
    const humanFresherEligible =
      humanFresherRaw === ''
        ? undefined
        : humanFresherRaw.toLowerCase() === 'true'
          ? true
          : humanFresherRaw.toLowerCase() === 'false'
            ? false
            : null;

    const labeled =
      humanRole || humanCity || humanExperience || humanFresherRaw
        ? 'labeled'
        : 'pending';

    await EvaluationLabel.findOneAndUpdate(
      { jobId: row[idx.jobId] },
      {
        humanRole,
        humanCities: humanCity ? humanCity.split('|').map((c) => c.trim()).filter(Boolean) : [],
        humanExperience,
        humanFresherEligible,
        evaluationStatus: labeled,
      },
    );
    updated += 1;
  }

  const all = await EvaluationLabel.find().lean();
  return { updated, metrics: computeEvaluationMetrics(all) };
}

export async function getEvaluationSummary() {
  const all = await EvaluationLabel.find().lean();
  return {
    count: all.length,
    metrics: computeEvaluationMetrics(all),
  };
}
