/**
 * Show one India benchmark row for guided human labeling (read-only).
 * Usage: node src/scripts/showBenchmarkRow.js 1
 * Does NOT write human labels.
 */
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
      } else if (c === '"') {
        q = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      q = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (c !== '\r') {
      cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const n = Math.max(1, Number(process.argv[2] || 1));
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = rows[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const r = rows[n];
if (!r) {
  console.error(`Row ${n} not found (1..${rows.length - 1})`);
  process.exit(1);
}

const get = (k) => r[idx[k]] ?? '';
const payload = {
  row: n,
  jobId: get('jobId'),
  source: get('source'),
  company: get('company'),
  title: get('jobTitle'),
  location: get('originalLocation'),
  url: get('jobUrl'),
  ai: {
    role: get('aiRole'),
    city: get('aiCity'),
    experience: get('aiExperience'),
    fresherEligible: get('aiFresherEligible'),
  },
  humanStatus: get('evaluationStatus'),
  descriptionExcerpt: String(get('originalDescription') || '').slice(0, 1200),
  decide: {
    humanRole: 'ROLE_TAXONOMY exact string',
    humanCity: 'taxonomy cities joined by |, or blank',
    humanExperience: 'Internship|Fresher|Entry Level|Experienced|Unknown',
    humanFresherEligible: 'true|false|blank',
  },
  lookFor: [
    'Role: duties/title verbs (build software, sell, recruit, analyze data, design UI, etc.)',
    'City: explicit India city in location line (not company HQ boilerplate alone)',
    'Experience: intern/trainee/fresher/YOE/batch year vs senior language',
    'Fresher: explicit 0-1 YOE, freshers welcome, graduating batch, internship — else leave blank',
  ],
};

console.log(JSON.stringify(payload, null, 2));
