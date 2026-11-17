import fs from 'node:fs';
import path from 'node:path';

const yml = fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/india.yml', 'utf8');
const sections = { greenhouse: [], lever: [], ashby: [] };
let current = null;
for (const line of yml.split(/\r?\n/)) {
  if (/^greenhouse:\s*$/.test(line)) { current = 'greenhouse'; continue; }
  if (/^lever:\s*$/.test(line)) { current = 'lever'; continue; }
  if (/^ashby:\s*$/.test(line)) { current = 'ashby'; continue; }
  if (!current) continue;
  const name = line.match(/^\s+-\s+name:\s*(.+)\s*$/);
  const slug = line.match(/^\s+slug:\s*([^\s#]+)\s*$/);
  if (name) sections[current].push({ name: name[1].replace(/^["']|["']$/g, ''), slug: null });
  if (slug && sections[current].length) sections[current][sections[current].length - 1].slug = slug[1];
}
for (const k of Object.keys(sections)) {
  sections[k] = sections[k].filter((x) => x.slug);
  console.log(k, sections[k].length);
}

const indiaRe = /(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida|kolkata|ahmedabad)/i;
const earlyRe = /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad|graduate|entry[-\s]?level|junior)\b/i;

async function probeGreenhouse(slug) {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`);
  if (!r.ok) return null;
  const j = await r.json();
  const jobs = j.jobs || [];
  const india = jobs.filter((job) => indiaRe.test(job.location?.name || ''));
  const early = india.filter((job) => earlyRe.test(job.title || ''));
  return { total: jobs.length, india: india.length, early: early.length };
}
async function probeAshby(slug) {
  const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`);
  if (!r.ok) return null;
  const j = await r.json();
  const jobs = j.jobs || [];
  const india = jobs.filter((job) => indiaRe.test(`${job.location || ''} ${JSON.stringify(job.secondaryLocations || [])}`));
  const early = india.filter((job) => earlyRe.test(job.title || ''));
  return { total: jobs.length, india: india.length, early: early.length };
}
async function probeLever(slug) {
  const r = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
  if (!r.ok) return null;
  const jobs = await r.json();
  if (!Array.isArray(jobs)) return null;
  const india = jobs.filter((job) => indiaRe.test(`${job.categories?.location || ''} ${job.text || ''}`));
  const early = india.filter((job) => earlyRe.test(job.text || ''));
  return { total: jobs.length, india: india.length, early: early.length };
}

const results = [];
for (const c of sections.greenhouse) {
  try {
    const p = await probeGreenhouse(c.slug);
    if (p && (p.india > 0 || p.early > 0)) {
      results.push({ provider: 'greenhouse', ...c, ...p });
      console.log(`gh/${c.slug} india=${p.india} early=${p.early}`);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 40));
}
for (const c of sections.ashby) {
  try {
    const p = await probeAshby(c.slug);
    if (p && (p.india > 0 || p.early > 0)) {
      results.push({ provider: 'ashby', ...c, ...p });
      console.log(`ashby/${c.slug} india=${p.india} early=${p.early}`);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 40));
}
for (const c of sections.lever) {
  try {
    const p = await probeLever(c.slug);
    if (p && (p.india > 0 || p.early > 0)) {
      results.push({ provider: 'lever', ...c, ...p });
      console.log(`lever/${c.slug} india=${p.india} early=${p.early}`);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 40));
}

results.sort((a, b) => b.early - a.early || b.india - a.india);
const out = 'C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/india_portal_probe.json';
fs.writeFileSync(out, JSON.stringify({
  generatedAt: new Date().toISOString(),
  hits: results.length,
  earlySum: results.reduce((s, x) => s + x.early, 0),
  indiaSum: results.reduce((s, x) => s + x.india, 0),
  results,
}, null, 2));
console.log('WROTE', out, 'hits', results.length, 'earlySum', results.reduce((s, x) => s + x.early, 0));
