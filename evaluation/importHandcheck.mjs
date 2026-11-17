import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '../backend/package.json'));
const mongoose = require('mongoose');
const csvPath = path.join(__dirname, 'benchmark.csv');

function parseCsv(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      current.push(field);
      field = '';
    } else if (ch === '\n') {
      current.push(field);
      rows.push(current);
      current = [];
      field = '';
    } else if (ch !== '\r') field += ch;
  }
  if (field.length || current.length) {
    current.push(field);
    rows.push(current);
  }
  return rows;
}

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:62650/';
await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'firststep_ai' });

const table = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const header = table[0];
const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const col = mongoose.connection.db.collection('evaluationlabels');

let n = 0;
for (const row of table.slice(1)) {
  if (!row[idx.jobId]) continue;
  const humanRole = row[idx.humanRole]?.trim();
  const humanCity = row[idx.humanCity]?.trim();
  const humanExperience = row[idx.humanExperience]?.trim();
  const fr = row[idx.humanFresherEligible]?.trim();
  const humanFresherEligible =
    fr === '' ? null : fr.toLowerCase() === 'true' ? true : fr.toLowerCase() === 'false' ? false : null;
  const aiFr = row[idx.aiFresherEligible]?.trim();

  await col.updateOne(
    { jobId: new mongoose.Types.ObjectId(row[idx.jobId]) },
    {
      $set: {
        jobId: new mongoose.Types.ObjectId(row[idx.jobId]),
        originalTitle: row[idx.originalTitle],
        company: row[idx.company],
        originalDescription: row[idx.originalDescription],
        aiRole: row[idx.aiRole],
        aiCities: (row[idx.aiCity] || '').split('|').filter(Boolean),
        aiExperience: row[idx.aiExperience],
        aiFresherEligible:
          aiFr === '' ? null : aiFr === 'true' ? true : aiFr === 'false' ? false : null,
        humanRole,
        humanCities: humanCity ? humanCity.split('|').filter(Boolean) : [],
        humanExperience,
        humanFresherEligible,
        evaluationStatus: 'labeled',
        labeledAt: new Date(),
      },
    },
    { upsert: true },
  );
  n += 1;
}

console.log(JSON.stringify({ upserted: n, uri }, null, 2));
const summary = await fetch('http://localhost:5050/api/evaluation/summary').then((r) => r.json());
console.log(JSON.stringify(summary, null, 2));
await mongoose.disconnect();
