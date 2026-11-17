/**
 * Extract YOE / eligibility / role cues for pending rows that need closer reading.
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

function strip(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const needCloser = [9, 12, 13, 14, 15, 16, 21, 25, 27, 30, 31, 32, 34, 35, 36, 37, 38, 40, 41, 42, 43, 44, 47];

const table = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const h = table[0];
const idx = Object.fromEntries(h.map((k, i) => [k, i]));

const patterns = [
  /experience[:\s][^.]{0,120}/gi,
  /\b\d\s*[-–to]+\s*\d\s*\+?\s*years?\b/gi,
  /\b(fresher|internship|intern|graduate|trainee|new grad|entry[- ]level|junior)\b[^.]{0,80}/gi,
  /\b(bachelor|master|degree|pass-?out|batch)\b[^.]{0,80}/gi,
];

for (const rowNum of needCloser) {
  const r = table[rowNum];
  if (!r) continue;
  const desc = strip(r[idx.originalDescription]);
  const hits = [];
  for (const p of patterns) {
    const m = desc.match(p);
    if (m) hits.push(...m.slice(0, 4));
  }
  console.log(
    JSON.stringify({
      row: rowNum,
      company: r[idx.company],
      title: r[idx.jobTitle],
      loc: r[idx.originalLocation],
      hits: [...new Set(hits)].slice(0, 12),
      mid: desc.slice(400, 900),
    }),
  );
}
