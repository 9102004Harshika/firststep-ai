import fs from 'node:fs';
const indiaRe=/(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida)/i;
const earlyRe=/\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad|graduate|entry[-\s]?level|junior)\b/i;
async function scan(file, kind){
  const csv=fs.readFileSync(file,'utf8').trim().split(/\r?\n/).slice(1);
  const tokens=csv.map(l=>l.split(',')[1]).filter(Boolean);
  console.log(kind,'tokens',tokens.length);
  const hits=[];
  let i=0; const conc=20;
  async function worker(){
    while(i<tokens.length){
      const idx=i++; const token=tokens[idx];
      try{
        if(kind==='lever'){
          const r=await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`);
          if(!r.ok) continue;
          const jobs=await r.json();
          if(!Array.isArray(jobs)) continue;
          const india=jobs.filter(j=>indiaRe.test(`${j.categories?.location||''}`));
          const early=india.filter(j=>earlyRe.test(j.text||''));
          if(india.length) hits.push({token,india:india.length,early:early.length,total:jobs.length});
          if(early.length) console.log('lever',token,india.length,early.length);
        } else {
          const r=await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`);
          if(!r.ok) continue;
          const j=await r.json();
          const jobs=j.jobs||[];
          const india=jobs.filter(job=>indiaRe.test(`${job.location||''}`));
          const early=india.filter(job=>earlyRe.test(job.title||''));
          if(india.length) hits.push({token,india:india.length,early:early.length,total:jobs.length});
          if(early.length) console.log('ashby',token,india.length,early.length);
        }
      }catch{}
    }
  }
  await Promise.all(Array.from({length:conc},()=>worker()));
  hits.sort((a,b)=>b.early-a.early||b.india-a.india);
  fs.writeFileSync(`C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/${kind}_india_early_scan.json`, JSON.stringify({hits, earlySum:hits.reduce((s,x)=>s+x.early,0)},null,2));
  console.log(kind,'indiaBoards',hits.length,'earlySum',hits.reduce((s,x)=>s+x.early,0));
}
await scan('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/lever.csv','lever');
await scan('C:/Users/abcom/Desktop/harshi/firststep AI/backend/tmp/ashby.csv','ashby');
