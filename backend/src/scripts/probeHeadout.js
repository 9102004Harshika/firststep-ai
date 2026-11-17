const ua='Mozilla/5.0';
const list=await fetch('https://careerscan.in/api/jobs?q=intern+talent+acquisition+headout&limit=5',{headers:{'User-Agent':ua,Accept:'application/json'}}).then(r=>r.json());
const job=list.jobs[0];
console.log(JSON.stringify(job,null,2).slice(0,1500));
const html=await fetch('https://careerscan.in/jobs/'+job.slug,{headers:{'User-Agent':ua}}).then(r=>r.text());
const hrefs=[...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]);
const external=[...new Set(hrefs.filter(h=>!/careerscan\.in|google|facebook|twitter|yandex|linkedin\.com\/sharing|schemas\.org|w3\.org|mc\.yandex/i.test(h)))];
console.log('external', external);
// description from escaped JSON
const desc=html.match(/description\\\":\\\"(.*?)\\\",\\\"benefits/);
console.log('desc?', !!desc, desc?.[1]?.slice(0,300));
const desc2=html.match(/\\"description\\":\\"(.*?)\\",\\"benefits\\"/);
console.log('desc2?', !!desc2, desc2?.[1]?.slice(0,300));
