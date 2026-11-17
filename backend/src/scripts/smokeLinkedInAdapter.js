import { fetchLinkedInGuestJobs } from '../services/ingestion/adapters/linkedinGuest.js';
const jobs = await fetchLinkedInGuestJobs('jobs-guest-india-early', 'LinkedIn', {
  countryRelevance: 'india',
  maxJobs: 25,
  pagesPerQuery: 2,
  linkedinQueries: [
    'software engineer intern India',
    'data science intern Bangalore',
    'graduate engineer trainee India',
    'fresher software engineer India',
  ],
});
console.log(JSON.stringify({
  count: jobs.length,
  samples: jobs.slice(0, 10).map(j => ({ title: j.title, company: j.company, loc: j.locationRaw, url: j.jobUrl })),
}, null, 2));
