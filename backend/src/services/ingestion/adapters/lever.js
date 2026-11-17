import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

/**
 * Lever Postings API
 * https://github.com/lever/postings-api
 *
 * Admission is geography-first. Early-career keywords never establish India relevance.
 */
export async function fetchLeverJobs(boardId, employer, sourceMeta = {}) {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(boardId)}?mode=json`;
  const payload = await fetchWithRetry(url);
  const jobs = Array.isArray(payload) ? payload : [];

  return jobs
    .map((job) => {
      const categories = job.categories || {};
      const locationRaw = [categories.location, categories.commitment, categories.team]
        .filter(Boolean)
        .join(' | ');

      return {
        externalId: String(job.id),
        title: job.text || 'Untitled',
        company: employer,
        descriptionHtml: job.description || job.descriptionPlain || '',
        locationRaw,
        jobUrl: job.hostedUrl || job.applyUrl || `https://jobs.lever.co/${boardId}/${job.id}`,
        source: 'lever',
        sourceBoard: boardId,
        postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
        employmentTypeHint: categories.commitment || null,
        raw: job,
      };
    })
    .filter((job) =>
      shouldIngestJob({
        locationRaw: job.locationRaw,
        title: job.title,
        description: job.descriptionHtml,
        countryRelevance: sourceMeta.countryRelevance,
        boardScope: sourceMeta.boardScope || null,
      }).keep,
    );
}
