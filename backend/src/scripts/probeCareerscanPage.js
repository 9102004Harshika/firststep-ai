const ua='Mozilla/5.0';
async function page(offset){
  const url=`https://careerscan.in/api/jobs?q=intern&limit=50&offset=${offset}`;
  const r=await fetch(url,{headers:{'User-Agent':ua,Accept:'application/json'}});
  const j=await r.json();
  console.log('offset',offset,'count',j.jobs?.length,'total',j.total,'first',j.jobs?.[0]?.id,'last',j.jobs?.at(-1)?.id);
}
await page(0); await page(50); await page(100);
// try cursor / page
for (const u of [
  'https://careerscan.in/api/jobs?q=intern&limit=50&page=2',
  'https://careerscan.in/api/jobs?q=intern&limit=50&skip=50',
  'https://careerscan.in/api/jobs?q=intern&limit=100'
]) {
  const r=await fetch(u,{headers:{'User-Agent':ua,Accept:'application/json'}});
  const j=await r.json();
  console.log(u, 'status',r.status,'count',j.jobs?.length,'total',j.total);
}
// sample HTML fields
const list=await fetch('https://careerscan.in/api/jobs?q=software+intern&limit=3',{headers:{'User-Agent':ua,Accept:'application/json'}}).then(r=>r.json());
const slug=list.jobs[0].slug;
const html=await fetch('https://careerscan.in/jobs/'+slug,{headers:{'User-Agent':ua}}).then(r=>r.text());
console.log('slug',slug,'htmlLen',html.length);
const apply= [...html.matchAll(/href=\"(https?:\/\/[^\"]+)\"/g)].map(m=>m[1]).find(h=>!/careerscan\.in|google|facebook|twitter|yandex|linkedin\.com\/sharing/i.test(h));
console.log('apply',apply);
const descMatch=html.match(/jobDescription|description|dangerouslySetInnerHTML|\"content\":\"([^\"]{40,})/);
console.log('desc hint', descMatch?.[0]?.slice(0,120));
// next-data
const nd=html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">(.*?)<\/script>/);
if(nd){
  const data=JSON.parse(nd[1]);
  const job=data?.props?.pageProps?.job || data?.props?.pageProps;
  console.log('nextdata keys', Object.keys(data?.props?.pageProps||{}));
  console.log(JSON.stringify(job,null,2).slice(0,1500));
}
