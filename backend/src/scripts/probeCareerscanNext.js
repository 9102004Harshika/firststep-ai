const ua='Mozilla/5.0';
const list=await fetch('https://careerscan.in/api/jobs?q=software+intern+bangalore&limit=5',{headers:{'User-Agent':ua,Accept:'application/json'}}).then(r=>r.json());
for (const job of list.jobs||[]) {
  console.log('LIST', job.title, '|', job.location, '|', job.company?.name);
  const html=await fetch('https://careerscan.in/jobs/'+job.slug,{headers:{'User-Agent':ua}}).then(r=>r.text());
  const nd=html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if(!nd){ console.log(' no nextdata'); continue; }
  const data=JSON.parse(nd[1]);
  const pp=data.props?.pageProps||{};
  console.log(' pageProps keys', Object.keys(pp));
  const j=pp.job||pp.data||pp;
  console.log(JSON.stringify(j,null,2).slice(0,2000));
  break;
}
