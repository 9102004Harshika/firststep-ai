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
    } else if (c === ',') {
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
const h = table[0];
const idx = Object.fromEntries(h.map((k, i) => [k, i]));

for (const name of ['Landor', 'Capco', 'Shift', 'Vertiv', 'SEW-EURODRIVE']) {
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    if (!String(r[idx.company]).includes(name) && !String(r[idx.jobTitle]).includes(name)) continue;
    const desc = String(r[idx.originalDescription] || '');
    console.log(
      JSON.stringify(
        {
          row: i,
          company: r[idx.company],
          title: r[idx.jobTitle],
          loc: r[idx.originalLocation],
          url: r[idx.jobUrl],
          status: r[idx.evaluationStatus],
          australia: /australia/i.test(desc),
          us401k: /401k/i.test(desc),
          battery: /Battery Specialist/i.test(desc),
          descSnippet: desc.replace(/\s+/g, ' ').slice(0, 280),
        },
        null,
        2,
      ),
    );
  }
}

console.log('\n--- row 3 ---');
const r3 = table[3];
console.log(
  JSON.stringify(
    {
      company: r3[idx.company],
      title: r3[idx.jobTitle],
      loc: r3[idx.originalLocation],
      url: r3[idx.jobUrl],
      status: r3[idx.evaluationStatus],
      descSnippet: String(r3[idx.originalDescription] || '')
        .replace(/\s+/g, ' ')
        .slice(0, 350),
    },
    null,
    2,
  ),
);
