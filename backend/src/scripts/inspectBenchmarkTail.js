import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../../evaluation/india_benchmark_50.csv');

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

const table = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = table[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
console.log('count', table.length - 1);
for (let i = 1; i < table.length; i++) {
  const r = table[i];
  const status = r[idx.evaluationStatus];
  const title = r[idx.jobTitle];
  const company = r[idx.company];
  const loc = r[idx.originalLocation];
  if (status === 'labeled' || i >= table.length - 4 || /Associate Manager|Okta|Sigmoid|Vertiv|401k|Battery Specialist/i.test(title + r[idx.originalDescription].slice(0, 80) + company)) {
    console.log(
      JSON.stringify({
        row: i,
        status,
        company,
        title,
        loc,
        descStart: String(r[idx.originalDescription] || '').slice(0, 120),
      }),
    );
  }
}
