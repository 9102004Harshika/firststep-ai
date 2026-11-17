// LinkedIn guest API smoke for India internships
const queries = [
  'internship software engineer India',
  'fresher software engineer Bangalore',
  'graduate trainee India',
  'campus hiring software India',
  'data science intern Bangalore',
  'software intern Hyderabad',
  'analyst trainee Mumbai',
];
const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
for (const q of queries) {
  const url=`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=India&f_TPR=r604800&start=0`;
  const r=await fetch(url,{headers:{'User-Agent':ua,Accept:'text/html'}});
  const html=await r.text();
  const cards=[...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)].map(m=>m[1]);
  const titles=[...html.matchAll(/class="base-search-card__title">\s*([^<]+)/g)].map(m=>m[1].trim());
  const companies=[...html.matchAll(/class="hidden-nested-link"[^>]*>\s*([^<]+)/g)].map(m=>m[1].trim());
  const locs=[...html.matchAll(/class="job-search-card__location">\s*([^<]+)/g)].map(m=>m[1].trim());
  console.log('\nQ', q, 'status', r.status, 'cards', cards.length);
  for (let i=0;i<Math.min(5,titles.length);i++){
    console.log(' ', titles[i], '|', companies[i], '|', locs[i], '| id', cards[i]);
  }
}
