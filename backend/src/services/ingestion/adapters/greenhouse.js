import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

function locationFromJob(job) {
  const location = job.location?.name || '';
  const offices = Array.isArray(job.offices)
    ? job.offices.map((o) => o.name).filter(Boolean).join('; ')
    : '';
  return [location, offices].filter(Boolean).join(' | ');
}

/**
 * Greenhouse Job Board API
 * https://developers.greenhouse.io/job-board.html
 *
 * Admission is geography-first. Early-career keywords never establish India relevance.
 */
export async function fetchGreenhouseJobs(boardId, employer, sourceMeta = {}) {
  const listUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardId)}/jobs`;
  const payload = await fetchWithRetry(listUrl);
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  const selected = jobs.filter((job) => {
    const decision = shouldIngestJob({
      locationRaw: locationFromJob(job),
      title: job.title || '',
      countryRelevance: sourceMeta.countryRelevance,
      boardScope: sourceMeta.boardScope || null,
    });
    return decision.keep;
  });

  const detailed = [];
  for (const job of selected) {
    let content = job.content || '';
    if (!content) {
      try {
        const detail = await fetchWithRetry(
          `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardId)}/jobs/${job.id}`,
        );
        content = detail?.content || '';
      } catch {
        content = '';
      }
    }

    const locationRaw = locationFromJob(job);
    // Re-check with description for india-remote eligibility phrases.
    const decision = shouldIngestJob({
      locationRaw,
      title: job.title || '',
      description: content,
      countryRelevance: sourceMeta.countryRelevance,
      boardScope: sourceMeta.boardScope || null,
    });
    if (!decision.keep) continue;

    const absoluteUrl =
      job.absolute_url || `https://job-boards.greenhouse.io/${boardId}/jobs/${job.id}`;

    detailed.push({
      externalId: String(job.id),
      title: job.title || 'Untitled',
      company: employer,
      descriptionHtml: content,
      locationRaw,
      jobUrl: absoluteUrl,
      source: 'greenhouse',
      sourceBoard: boardId,
      postedAt: job.updated_at || job.created_at || null,
      employmentTypeHint: null,
      raw: { ...job, content },
    });
  }

  return detailed;
}
