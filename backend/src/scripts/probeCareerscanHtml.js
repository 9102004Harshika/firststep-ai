const ua='Mozilla/5.0';
const slug='software-engineer-intern-frontend-muXXXX';
const list=await fetch('https://careerscan.in/api/jobs?q=software+engineer+intern+frontend&limit=3',{headers:{'User-Agent':ua,Accept:'application/json'}}).then(r=>r.json());
const job=list.jobs.find(j=>/bengaluru|bangalore/i.test(j.location||'')) || list.jobs[0];
console.log(job.title, job.slug, job.location);
const html=await fetch('https://careerscan.in/jobs/'+job.slug,{headers:{'User-Agent':ua}}).then(r=>r.text());
const hrefs=[...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
console.log('external', [...new Set(hrefs.filter(h=>!/careerscan\.in|google|facebook|twitter|yandex|linkedin\.com\/sharing|schemas\.org|w3\.org/i.test(h)))].slice(0,15));
// look for JSON blobs
for (const re of [
  /\\"applyUrl\\":\\"(https?:\\\\\/\\\\\/[^\\"]+)\\"/,
  /"applyUrl":"(https?:\\\/\\\/[^"]+)"/,
  /"applicationUrl":"(https?:\\\/\\\/[^"]+)"/,
  /"sourceUrl":"(https?:\\\/\\\/[^"]+)"/,
  /"externalUrl":"(https?:\\\/\\\/[^"]+)"/,
  /"description":"([^"]{80,300})"/,
  /"jobDescription":"([^"]{80,300})"/,
]) {
  const m=html.match(re);
  if(m) console.log('MATCH', re, m[1].slice(0,200));
}
// RSC payload
const rsc=[...html.matchAll(/self\.__next_f\.push\((\[.*?\])\)/g)].slice(0,3);
console.log('rsc pushes', rsc.length);
if(html.includes('applyUrl')) console.log('has applyUrl string');
if(html.includes('jobDescription')) console.log('has jobDescription string');
console.log('snippet around Apply', html.includes('Apply'));
const idx=html.indexOf('Apply on');
console.log(html.slice(Math.max(0,idx-100), idx+300));
