const ua = 'Mozilla/5.0';
async function list(q) {
  const url = `https://careerscan.in/api/jobs?${q}`;
  const r = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } });
  const j = await r.json();
  return j;
}
function isIndia(job) {
  const blob = `${job.location || ''} ${job.city || ''} ${job.state || ''}`;
  return /(india|bengaluru|bangalore|hyderabad|mumbai|pune|delhi|gurugram|gurgaon|chennai|noida|kolkata|ahmedabad|kochi|chandigarh|jaipur|indore|nagpur|coimbatore|mysuru|lucknow|vadodara|surat|patna|bhopal|visakhapatnam|thiruvananthapuram|trivandrum|navi mumbai|faridabad|ghaziabad|noida)/i.test(blob)
    && !/(united states|\bUSA\b|\bUK\b|london|remote \(united|draper,\s*ut)/i.test(blob);
}
function isEarly(job) {
  const blob = `${job.title || ''} ${job.experience || ''} ${job.expLabel || ''}`;
  return /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad|graduate|entry|junior|associate)\b/i.test(blob)
    || ['Fresher','Entry','Internship'].includes(job.experience);
}
const queries = [
  'q=internship&limit=50',
  'q=intern&limit=50',
  'q=fresher&limit=50',
  'q=graduate+trainee&limit=50',
  'q=campus&limit=50',
  'q=apprentice&limit=50',
  'q=junior&limit=50',
  'q=entry+level&limit=50',
  'q=software+intern&limit=50',
  'q=data+intern&limit=50',
  'q=engineering+intern&limit=50',
  'q=analyst+trainee&limit=50',
  'q=graduate+engineer&limit=50',
  'experience=Fresher&limit=50',
  'q=sde+intern&limit=50',
  'q=software+engineer+intern&limit=50',
];
const map = new Map();
for (const q of queries) {
  const j = await list(q);
  let added = 0;
  for (const job of j.jobs || []) {
    if (!isIndia(job) || !isEarly(job)) continue;
    if (!map.has(job.id)) { map.set(job.id, job); added++; }
  }
  console.log(q, 'apiTotal=', j.total, 'page=', (j.jobs||[]).length, 'newIndiaEarly=', added);
}
console.log('UNIQUE_INDIA_EARLY', map.size);
const byExp = {};
for (const j of map.values()) {
  byExp[j.experience || 'na'] = (byExp[j.experience || 'na'] || 0) + 1;
}
console.log('byExp', byExp);
console.log('samples', [...map.values()].slice(0, 15).map(j => `${j.title} | ${j.company?.name} | ${j.location} | ${j.experience}`));
