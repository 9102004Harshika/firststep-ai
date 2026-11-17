import fs from 'node:fs';
const csv = fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/greenhouse.csv', 'utf8');
const lines = csv.trim().split(/\r?\n/).slice(1);
const tokens = lines.map((l) => {
  const parts = l.split(',');
  return { token: parts[1], openRoles: Number(parts[5] || 0) };
}).filter((x) => x.token && x.openRoles > 0);

console.log('boards with roles', tokens.length);
const indiaRe = /(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida|kolkata|ahmedabad)/i;
const earlyRe = /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad|graduate|entry[-\s]?level|junior)\b/i;

async function probe(token) {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`);
  if (!r.ok) return null;
  const j = await r.json();
  const jobs = j.jobs || [];
  const india = jobs.filter((job) => indiaRe.test(job.location?.name || ''));
  if (!india.length) return null;
  const early = india.filter((job) => earlyRe.test(job.title || ''));
  return { token, total: jobs.length, india: india.length, early: early.length };
}

const concurrency = 25;
const hits = [];
let i = 0;
async function worker() {
  while (i < tokens.length) {
    const idx = i++;
    const t = tokens[idx];
    try {
      const p = await probe(t.token);
      if (p) {
        hits.push(p);
        if (p.early > 0) console.log(`EARLY ${p.token} india=${p.india} early=${p.early}`);
      }
    } catch {}
    if (idx % 200 === 0) console.log('progress', idx, '/', tokens.length, 'hits', hits.length);
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()));
hits.sort((a, b) => b.early - a.early || b.india - a.india);
const earlyHits = hits.filter((h) => h.early > 0);
fs.writeFileSync(
  'C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/greenhouse_india_early_scan.json',
  JSON.stringify({
    scanned: tokens.length,
    indiaBoards: hits.length,
    earlyBoards: earlyHits.length,
    earlySum: earlyHits.reduce((s, x) => s + x.early, 0),
    earlyHits,
    topIndia: hits.slice(0, 40),
  }, null, 2),
);
console.log(JSON.stringify({
  scanned: tokens.length,
  indiaBoards: hits.length,
  earlyBoards: earlyHits.length,
  earlySum: earlyHits.reduce((s, x) => s + x.early, 0),
}, null, 2));
