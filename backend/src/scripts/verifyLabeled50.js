import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLE_TAXONOMY, EXPERIENCE_LEVELS, INDIAN_CITIES } from '../config/constants.js';

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
const issues = [];
const summary = { labeled: 0, fresherTrue: 0, fresherFalse: 0, fresherBlank: 0, byExp: {}, byRole: {} };

for (let i = 1; i < rows.length; i += 1) {
  const r = rows[i];
  if (r[idx.evaluationStatus] !== 'labeled') {
    issues.push(`row ${i} not labeled`);
    continue;
  }
  summary.labeled += 1;
  const role = r[idx.humanRole];
  const city = r[idx.humanCity];
  const exp = r[idx.humanExperience];
  const fr = r[idx.humanFresherEligible];
  if (!ROLE_TAXONOMY.includes(role)) issues.push(`row ${i} bad role ${role}`);
  if (!EXPERIENCE_LEVELS.includes(exp)) issues.push(`row ${i} bad exp ${exp}`);
  if (city) {
    for (const c of city.split('|')) {
      if (!INDIAN_CITIES.includes(c)) issues.push(`row ${i} bad city ${c}`);
    }
  }
  if (!['true', 'false', ''].includes(fr)) issues.push(`row ${i} bad fresher ${fr}`);
  if (fr === 'true') summary.fresherTrue += 1;
  else if (fr === 'false') summary.fresherFalse += 1;
  else summary.fresherBlank += 1;
  summary.byExp[exp] = (summary.byExp[exp] || 0) + 1;
  summary.byRole[role] = (summary.byRole[role] || 0) + 1;
}

console.log(JSON.stringify({ summary, issues, sample: [1, 4, 7, 8, 14, 27, 40, 50].map((n) => ({
  row: n,
  company: rows[n][idx.company],
  human: [rows[n][idx.humanRole], rows[n][idx.humanCity] || '(blank)', rows[n][idx.humanExperience], rows[n][idx.humanFresherEligible] || 'blank'].join(' | '),
})) }, null, 2));
