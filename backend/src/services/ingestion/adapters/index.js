import { fetchGreenhouseJobs } from './greenhouse.js';
import { fetchLeverJobs } from './lever.js';
import { fetchAshbyJobs } from './ashby.js';
import { fetchSmartRecruitersJobs } from './smartrecruiters.js';
import { fetchCareerscanJobs } from './careerscan.js';
import { fetchWorkdayJobs } from './workday.js';
import { fetchLinkedInGuestJobs } from './linkedinGuest.js';

const adapters = {
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  ashby: fetchAshbyJobs,
  smartrecruiters: fetchSmartRecruitersJobs,
  careerscan: fetchCareerscanJobs,
  workday: fetchWorkdayJobs,
  linkedin: fetchLinkedInGuestJobs,
};

export async function fetchJobsForSource(source) {
  const adapter = adapters[source.provider];
  if (!adapter) {
    throw new Error(`No adapter for provider: ${source.provider}`);
  }
  // Always pass source meta so geography policy is consistent across providers.
  return adapter(source.boardId, source.employer, source);
}

export { adapters };
