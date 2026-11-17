const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const id='4480620356';
const r=await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`,{headers:{'User-Agent':ua,Accept:'text/html'}});
const html=await r.text();
const title=(html.match(/class="top-card-layout__title[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const company=(html.match(/class="topcard__org-name-link[^"]*"[^>]*>([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const loc=(html.match(/class="topcard__flavor topcard__flavor--bullet"[^>]*>\s*([^<]+)/)||[])[1]?.replace(/\s+/g,' ').trim();
const desc=((html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/)||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
console.log(JSON.stringify({
  status:r.status,
  title,company,loc,
  quotes:{
    sales:(desc.match(/Technical Sales|sales enquiries|sales targets|sales departments/i)||[])[0],
    locLine:(desc.match(/Role Location:\s*Vadodara/i)||[])[0] || loc,
    exp:(desc.match(/Experience:\s*Fresh graduates or candidates with up to 1 year of experience\.?/i)||[])[0],
    edu:(desc.match(/BE\/B\.Tech graduates from the 2026 batch[^.]{0,40}/i)||[])[0],
  },
  respSnippet: desc.slice(desc.indexOf('Responsibilities'), desc.indexOf('Responsibilities')+280),
},null,2));
