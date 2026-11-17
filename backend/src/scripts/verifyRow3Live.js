const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const id='4471627041';
const r=await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`,{headers:{'User-Agent':ua,Accept:'text/html'}});
const html=await r.text();
const title=(html.match(/class="top-card-layout__title[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const company=(html.match(/class="topcard__org-name-link[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const loc=(html.match(/class="topcard__flavor topcard__flavor--bullet"[^>]*>\s*([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const desc=((html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/)||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log(JSON.stringify({
  status:r.status,title,company,loc,
  has2026:/2026/i.test(title+desc),
  hasTrainee:/trainee/i.test(title+desc),
  hasBattery:/Battery Specialist/i.test(desc),
  hasElectrical:/Electrical/i.test(title+desc),
  fresherSignals:(desc.match(/fresh|passout|graduate|trainee|0\s*[-–to]+\s*1|entry/ig)||[]).slice(0,12),
  descTail: desc.slice(-600),
  descHead: desc.slice(0,400),
},null,2));
