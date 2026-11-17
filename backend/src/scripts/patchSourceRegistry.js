import fs from 'node:fs';
const registryPath = 'C:/Users/abcom/Desktop/harshi/firststep AI/backend/src/services/ingestion/sourceRegistry.js';
let src = fs.readFileSync(registryPath, 'utf8');

const gh = JSON.parse(fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/greenhouse_india_early_scan.json','utf8')).earlyHits;
const ashby = JSON.parse(fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/ashby_india_early_scan.json','utf8')).hits.filter(x=>x.early>0);
const leverHits = JSON.parse(fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/lever_india_early_scan.json','utf8')).hits;
const lever = leverHits.filter(x=>x.early>0 || ['cred','meesho','mindtickle'].includes(x.token));

const existing = new Set([...src.matchAll(/boardId:\s*'([^']+)'/g)].map(m=>m[1]));

function pretty(token){
  return token.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

const lines = [];
for (const h of gh) {
  if (existing.has(h.token)) continue;
  lines.push(`  { employer: '${pretty(h.token).replace(/'/g,"\\'")}', provider: 'greenhouse', boardId: '${h.token}', countryRelevance: 'india-hiring', sourceUrl: 'https://job-boards.greenhouse.io/${h.token}', enabled: true },`);
  existing.add(h.token);
}
for (const h of ashby) {
  if (existing.has(h.token)) continue;
  lines.push(`  { employer: '${pretty(h.token).replace(/'/g,"\\'")}', provider: 'ashby', boardId: '${h.token}', countryRelevance: 'india-hiring', sourceUrl: 'https://jobs.ashbyhq.com/${h.token}', enabled: true },`);
  existing.add(h.token);
}
for (const h of lever) {
  if (existing.has(h.token)) continue;
  lines.push(`  { employer: '${pretty(h.token).replace(/'/g,"\\'")}', provider: 'lever', boardId: '${h.token}', countryRelevance: 'india', sourceUrl: 'https://jobs.lever.co/${h.token}', enabled: true },`);
  existing.add(h.token);
}

const linkedinBlock = `
  // LinkedIn public jobs-guest discovery (India early-career)
  {
    employer: 'LinkedIn India Early Discovery',
    provider: 'linkedin',
    boardId: 'jobs-guest-india-early',
    countryRelevance: 'india',
    sourceUrl: 'https://www.linkedin.com/jobs/',
    enabled: true,
    maxJobs: 160,
    pagesPerQuery: 4,
    boardScope: 'linkedin-india-early',
  },
`;

const marker = '  // Lever adapter remains supported';
if (!src.includes("provider: 'linkedin'")) {
  src = src.replace(marker, linkedinBlock + '\n' + marker);
}
if (lines.length) {
  src = src.replace(marker, `  // Auto-added from live India early-career board scan (2026-11-17)\n${lines.join('\n')}\n\n${marker}`);
}
fs.writeFileSync(registryPath, src);
console.log('added', lines.length, 'boards; linkedin wired=', src.includes("provider: 'linkedin'"));
