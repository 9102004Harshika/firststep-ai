import fs from 'node:fs';
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
const rows = parseCsv(fs.readFileSync('C:/Users/abcom/Desktop/harshi/firststep AI/evaluation/india_benchmark_50.csv','utf8'));
const h = rows[0]; const idx = Object.fromEntries(h.map((x,i)=>[x,i]));
const r = rows[3];
const desc = r[idx.originalDescription] || '';
console.log(JSON.stringify({
  title: r[idx.jobTitle],
  company: r[idx.company],
  loc: r[idx.originalLocation],
  url: r[idx.jobUrl],
  hasBatterySpecialist: /Battery Specialist/i.test(desc),
  hasDiplomaTrainee: /Diploma Engineer Trainee/i.test(desc),
  has2026: /2026/i.test(r[idx.jobTitle]+desc),
  experienceHits: desc.match(/experience|fresh|passout|graduate|trainee|years?/gi)?.slice(0,20),
  // show if US field service boilerplate dominates
  hasPPE: /PPE|401k|Profit Sharing/i.test(desc),
  hasChennai: /Chennai/i.test(r[idx.originalLocation]+desc),
  mid: desc.slice(800, 1400),
  end: desc.slice(-500),
}, null, 2));
