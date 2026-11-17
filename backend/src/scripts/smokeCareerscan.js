import { fetchCareerscanJobs } from '../services/ingestion/adapters/careerscan.js';
const jobs = await fetchCareerscanJobs('india-early', 'Careerscan', {
  countryRelevance: 'india',
  maxJobs: 30,
  maxPagesPerQuery: 1,
  boardScope: 'india-early-discovery',
});
console.log(JSON.stringify({
  count: jobs.length,
  samples: jobs.slice(0, 8).map(j => ({
    title: j.title,
    company: j.company,
    location: j.locationRaw,
    url: j.jobUrl,
  })),
}, null, 2));
