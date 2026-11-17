/**
 * Record one human-attested benchmark label into india_benchmark_50.csv.
 * Usage:
 *   node src/scripts/recordBenchmarkLabel.js 1 "Operations" "Pune" "Fresher" "true" \
 *     --roleEvidence "..." --cityEvidence "..." --expEvidence "..." --fresherEvidence "..."
 *
 * Only call after the human reviewer confirmed the four labels against the original posting.
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

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function parseArgs(argv) {
  const out = {
    row: Number(argv[2]),
    role: argv[3],
    city: argv[4],
    experience: argv[5],
    fresher: argv[6],
    roleEvidence: '',
    cityEvidence: '',
    expEvidence: '',
    fresherEvidence: '',
  };
  for (let i = 7; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--roleEvidence') out.roleEvidence = argv[++i] || '';
    else if (a === '--cityEvidence') out.cityEvidence = argv[++i] || '';
    else if (a === '--expEvidence') out.expEvidence = argv[++i] || '';
    else if (a === '--fresherEvidence') out.fresherEvidence = argv[++i] || '';
  }
  return out;
}

const args = parseArgs(process.argv);
// Allow blank/null/- for city or fresherEligible (PowerShell drops empty "" args).
for (const key of ['city', 'fresher']) {
  if (['blank', 'null', '-'].includes(String(args[key]).toLowerCase())) {
    args[key] = '';
  }
}
if (!args.row || !args.role || args.city == null || !args.experience || args.fresher == null) {
  console.error(
    'Usage: node recordBenchmarkLabel.js <row> <role> <city|blank> <experience> <fresher|blank> [--roleEvidence ...]...',
  );
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = rows[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const r = rows[args.row];
if (!r) {
  console.error(`Row ${args.row} missing`);
  process.exit(1);
}

r[idx.humanRole] = args.role;
r[idx.humanCity] = args.city;
r[idx.humanExperience] = args.experience;
r[idx.humanFresherEligible] = args.fresher;
r[idx.humanRoleEvidence] = args.roleEvidence;
r[idx.humanCityEvidence] = args.cityEvidence;
r[idx.humanExperienceEvidence] = args.expEvidence;
r[idx.humanFresherEvidence] = args.fresherEvidence;
r[idx.evaluationStatus] = 'labeled';

const lines = rows.map((row) => row.map(csvEscape).join(','));
fs.writeFileSync(csvPath, `${lines.join('\n')}\n`, 'utf8');

const labeled = rows.slice(1).filter((row) => row[idx.evaluationStatus] === 'labeled').length;
console.log(
  JSON.stringify(
    {
      recordedRow: args.row,
      jobId: r[idx.jobId],
      company: r[idx.company],
      title: r[idx.jobTitle],
      human: {
        role: args.role,
        city: args.city,
        experience: args.experience,
        fresher: args.fresher,
      },
      labeledCount: labeled,
      remaining: rows.length - 1 - labeled,
    },
    null,
    2,
  ),
);
