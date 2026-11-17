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
const labeled = rows.slice(1).filter((r) => r[idx.evaluationStatus] === 'labeled').length;
const hasXylem = rows.slice(1).some((r) => /Xylem/i.test(r[idx.company]));
const last = rows[rows.length - 1];
console.log(
  JSON.stringify(
    {
      total: rows.length - 1,
      labeled,
      xylemStillPresent: hasXylem,
      replacement: {
        company: last[idx.company],
        title: last[idx.jobTitle],
        loc: last[idx.originalLocation],
        url: last[idx.jobUrl],
        status: last[idx.evaluationStatus],
        descStart: String(last[idx.originalDescription] || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 400),
      },
      row7: {
        company: rows[7][idx.company],
        title: rows[7][idx.jobTitle],
        loc: rows[7][idx.originalLocation],
        status: rows[7][idx.evaluationStatus],
      },
    },
    null,
    2,
  ),
);
