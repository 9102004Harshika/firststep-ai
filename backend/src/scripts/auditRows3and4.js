import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../../evaluation/india_benchmark_50.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    const n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') {
        cur += '"';
        i += 1;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const h = rows[0];
const idx = Object.fromEntries(h.map((k, i) => [k, i]));

for (const n of [3, 4]) {
  const r = rows[n];
  console.log(
    JSON.stringify(
      {
        row: n,
        jobId: r[idx.jobId],
        company: r[idx.company],
        title: r[idx.jobTitle],
        loc: r[idx.originalLocation],
        url: r[idx.jobUrl],
        status: r[idx.evaluationStatus],
        human: {
          role: r[idx.humanRole],
          city: r[idx.humanCity],
          experience: r[idx.humanExperience],
          fresher: r[idx.humanFresherEligible],
        },
        evidence: {
          role: r[idx.humanRoleEvidence],
          city: r[idx.humanCityEvidence],
          exp: r[idx.humanExperienceEvidence],
          fresher: r[idx.humanFresherEvidence],
        },
        descSnippet: String(r[idx.originalDescription] || '')
          .replace(/\s+/g, ' ')
          .slice(0, 500),
      },
      null,
      2,
    ),
  );
}
