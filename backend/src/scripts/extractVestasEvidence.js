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
const r = rows[5]; // row 5
const desc = r[idx.originalDescription] || '';
const needles = [
  '0 to 2 years',
  '0-2 years',
  '0 – 2 years',
  'Graduate Engineer Trainee',
  'Chennai',
  'Power BI',
  'SQL',
  'Python',
  'turbine-performance',
  'Academic or project',
];
for (const n of needles) {
  const i = desc.toLowerCase().indexOf(n.toLowerCase());
  console.log(JSON.stringify({ needle: n, found: i >= 0, snippet: i >= 0 ? desc.slice(Math.max(0, i - 40), i + n.length + 80) : null }));
}
