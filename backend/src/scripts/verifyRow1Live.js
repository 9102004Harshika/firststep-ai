const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const id='4450473265';
const r=await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`,{headers:{'User-Agent':ua,Accept:'text/html'}});
const html=await r.text();
console.log('status', r.status, 'len', html.length);
const title=(html.match(/class="top-card-layout__title[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const company=(html.match(/class="topcard__org-name-link[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const loc=(html.match(/class="topcard__flavor topcard__flavor--bullet"[^>]*>\s*([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const desc=((html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/)||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const checks={
  hasPune: /Pune/i.test(loc+' '+desc),
  hasFreshers: /Freshers can apply/i.test(desc),
  has0to1: /0 to 1 year/i.test(desc),
  hasMRP: /Material Requirement Planning|MRP/i.test(desc),
  hasPPC: /Production Planning/i.test(desc),
  hasTrainee: /Graduate Engineer Trainee/i.test(title+' '+desc),
};
console.log(JSON.stringify({title,company,loc,checks,descSnippet:desc.slice(0,500),expSnippet:(desc.match(/Professional Experience.{0,80}/i)||[])[0],roleSnippet:(desc.match(/Role and Responsibility.{0,220}/i)||[])[0]},null,2));
