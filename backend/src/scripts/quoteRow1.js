import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const csvPath = 'C:/Users/abcom/Desktop/harshi/firststep AI/evaluation/india_benchmark_50.csv';
function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (q) {
      if (c === '"' && n === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const h = rows[0];
const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
const r = rows[1];
const desc = r[idx.originalDescription] || '';
const loc = r[idx.originalLocation] || '';
const title = r[idx.jobTitle] || '';
const needles = [
  /0\s*[-–to]+\s*1\s*year[^.\n]{0,40}/i,
  /Freshers?\s+can\s+apply[^.\n]{0,20}/i,
  /Professional Experience[^.\n]{0,80}/i,
  /Graduate Engineer Trainee[^.\n]{0,40}/i,
  /Production Planning[^.\n]{0,60}/i,
  /Material Requirement Planning[^.\n]{0,40}/i,
  /Capacity Planning[^.\n]{0,40}/i,
];
console.log(JSON.stringify({
  title,
  location: loc,
  url: r[idx.jobUrl],
  quotes: needles.map(re => {
    const m = desc.match(re);
    return m ? m[0] : null;
  }).filter(Boolean),
  responsibilitySnippet: (() => {
    const i = desc.indexOf('Role and Responsibility');
    return i >= 0 ? desc.slice(i, i + 320) : desc.slice(desc.indexOf('Key Responsibilities'), desc.indexOf('Key Responsibilities') + 280);
  })(),
}, null, 2));
