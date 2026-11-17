/**
 * Dump pending benchmark rows for human batch review (read-only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDIAN_CITIES, CITY_ALIASES, ROLE_TAXONOMY } from '../config/constants.js';

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

function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCity(loc, desc) {
  const blob = `${loc} ${desc}`.toLowerCase();
  const found = [];
  for (const [alias, canon] of Object.entries(CITY_ALIASES)) {
    if (blob.includes(alias) && !found.includes(canon)) found.push(canon);
  }
  for (const city of INDIAN_CITIES) {
    if (blob.includes(city.toLowerCase()) && !found.includes(city)) found.push(city);
  }
  // Greater Chennai Area etc.
  if (/chennai/i.test(blob) && !found.includes('Chennai')) found.push('Chennai');
  if (/bangalore|bengaluru/i.test(blob) && !found.includes('Bengaluru')) found.push('Bengaluru');
  return found;
}

function integrityFlags(title, loc, desc) {
  const flags = [];
  if (/\bBattery Specialist\b/i.test(desc) && !/battery specialist/i.test(title)) {
    flags.push('battery_specialist_mismatch');
  }
  if (/\b(401k|veterans with technical backgrounds|motor vehicle records)\b/i.test(desc) && /\bindia|chennai|pune|mumbai|bengaluru|hyderabad/i.test(loc)) {
    flags.push('us_benefits_on_india');
  }
  if (/\bmecha/i.test(title) && /\b(chemical processes?|manufacturing chemicals|chemical process engineering)\b/i.test(desc)) {
    flags.push('mech_vs_chem');
  }
  return flags;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
const h = rows[0];
const idx = Object.fromEntries(h.map((k, i) => [k, i]));

const out = [];
for (let i = 1; i < rows.length; i += 1) {
  const r = rows[i];
  if (r[idx.evaluationStatus] === 'labeled') continue;
  const title = r[idx.jobTitle] || '';
  const loc = r[idx.originalLocation] || '';
  const desc = stripHtml(r[idx.originalDescription] || '');
  const flags = integrityFlags(title, loc, desc);
  const cities = inferCity(loc, desc.slice(0, 800));

  const expHints = [];
  if (/\bintern(?:ship)?\b/i.test(title) || /\binternship\b/i.test(desc.slice(0, 1500))) expHints.push('intern_signal');
  if (/\bfresher\b/i.test(title + desc.slice(0, 2000))) expHints.push('fresher_word');
  if (/\bapprentice\b/i.test(title + desc.slice(0, 1000))) expHints.push('apprentice');
  if (/\btrainee\b/i.test(title)) expHints.push('trainee');
  if (/\b0\s*[-–to]+\s*1\s*year/i.test(desc) || /\b0\s*[-–to]+\s*2\s*year/i.test(desc)) expHints.push('yoe_range');
  if (/pass-?outs?|graduating batch|202[5-7]\s*batch/i.test(desc)) expHints.push('batch');
  if (/\bstudent\b/i.test(desc.slice(0, 800))) expHints.push('student');
  if (/\b[3-9]\+?\s*years?\b/i.test(desc.slice(0, 2000)) || /\bminimum\s+[2-9]\s*years?\b/i.test(desc)) {
    expHints.push('senior_yoe_risk');
  }

  out.push({
    row: i,
    company: r[idx.company],
    title,
    loc,
    url: r[idx.jobUrl],
    aiRole: r[idx.aiRole],
    aiCity: r[idx.aiCity],
    aiExp: r[idx.aiExperience],
    aiFresher: r[idx.aiFresherEligible],
    cities,
    flags,
    expHints,
    descSnippet: desc.slice(0, 450),
  });
}

const outPath = path.resolve(__dirname, '../../../evaluation/_batch_pending_review.json');
fs.writeFileSync(outPath, JSON.stringify({ pending: out.length, roles: ROLE_TAXONOMY, rows: out }, null, 2));
console.log(JSON.stringify({ pending: out.length, outPath, flagged: out.filter((r) => r.flags.length).map((r) => r.row) }, null, 2));
