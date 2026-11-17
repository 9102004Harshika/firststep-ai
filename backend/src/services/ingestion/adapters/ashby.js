import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

function locationFromJob(job) {
  return [
    job.location,
    ...(Array.isArray(job.secondaryLocations)
      ? job.secondaryLocations.map((l) => (typeof l === 'string' ? l : l?.location || ''))
      : []),
  ]
    .filter(Boolean)
    .join(' | ');
}

/**
 * Ashby public job board API
 * https://developers.ashbyhq.com/docs/public-job-posting-api
 *
 * Admission is geography-first. Early-career keywords never establish India relevance.
 */
export async function fetchAshbyJobs(boardId, employer, sourceMeta = {}) {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardId)}?includeCompensation=true`;
  const payload = await fetchWithRetry(url);
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .filter((job) => {
      const decision = shouldIngestJob({
        locationRaw: locationFromJob(job),
        title: job.title || '',
        description: job.descriptionHtml || job.descriptionPlain || '',
        countryRelevance: sourceMeta.countryRelevance,
        boardScope: sourceMeta.boardScope || null,
      });
      return decision.keep;
    })
    .map((job) => {
      const locationRaw = locationFromJob(job);
      return {
        externalId: String(job.id || job.jobUrl || job.title),
        title: job.title || 'Untitled',
        company: employer,
        descriptionHtml: job.descriptionHtml || job.descriptionPlain || '',
        locationRaw,
        jobUrl: job.jobUrl || job.applyUrl || `https://jobs.ashbyhq.com/${boardId}`,
        source: 'ashby',
        sourceBoard: boardId,
        postedAt: job.publishedAt || null,
        employmentTypeHint: job.employmentType || null,
        raw: job,
      };
    });
}
