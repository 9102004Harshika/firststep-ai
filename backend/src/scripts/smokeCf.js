const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const list=await fetch('https://careerscan.in/api/jobs?q=software+intern&limit=5',{headers:{'User-Agent':ua,Accept:'application/json'}}).then(r=>r.json());
const india=list.jobs.filter(j=>/india|bengaluru|bangalore|mumbai|hyderabad|pune|delhi|chennai|gurugram/i.test(j.location||''));
console.log('candidates', india.length);
for (const j of india.slice(0,3)) {
  const r=await fetch('https://careerscan.in/jobs/'+j.slug,{headers:{'User-Agent':ua,Accept:'text/html','Accept-Language':'en-US,en;q=0.9',Referer:'https://careerscan.in/'}});
  const html=await r.text();
  console.log(j.slug, 'status', r.status, 'cf', /Just a moment/i.test(html), 'len', html.length);
  const hrefs=[...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]).filter(h=>!/careerscan|google|yandex|facebook|twitter/i.test(h));
  console.log('  hrefs', [...new Set(hrefs)].slice(0,5));
  await new Promise(r=>setTimeout(r,1500));
}
