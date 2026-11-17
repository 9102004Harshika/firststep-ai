const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const slug = 'intern-talent-acquisition-apprentice-12-months-hsbc';
async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } });
  const text = await r.text();
  return { status: r.status, text, url };
}
const list = await get('https://careerscan.in/api/jobs?q=intern&experience=Fresher&limit=5');
console.log('LIST', list.status, list.text.slice(0, 300));
const jobs = JSON.parse(list.text).jobs || [];
for (const j of jobs.slice(0, 5)) {
  console.log('JOB', j.slug, j.title, j.company?.name, j.location);
  for (const u of [
    `https://careerscan.in/api/jobs/${j.slug}`,
    `https://careerscan.in/api/jobs/${j.id}`,
    `https://careerscan.in/api/job/${j.slug}`,
  ]) {
    const d = await get(u);
    console.log(' ', d.status, u, d.text.slice(0, 200).replace(/\s+/g, ' '));
    if (d.status === 200) {
      try {
        const obj = JSON.parse(d.text);
        console.log('  keys', Object.keys(obj).slice(0, 40).join(','));
        console.log('  applyUrl', obj.applyUrl || obj.applicationUrl || obj.url || obj.sourceUrl || obj.externalUrl);
        console.log('  description?', Boolean(obj.description || obj.jobDescription || obj.content));
      } catch {}
    }
  }
  const html = await fetch(`https://careerscan.in/jobs/${j.slug}`, { headers: { 'User-Agent': ua } }).then((r) => r.text());
  const hrefs = [...html.matchAll(/href=\"(https?:\/\/[^\"]+)\"/g)].map((m) => m[1]);
  const external = hrefs.filter((h) => !/careerscan\.in|google|facebook|twitter|linkedin\.com\/sharing|schemas\.org/i.test(h));
  console.log('  external hrefs', [...new Set(external)].slice(0, 10));
}
