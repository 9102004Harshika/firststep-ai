import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

/**
 * SmartRecruiters public postings API
 * https://developers.smartrecruiters.com/docs/listposts
 *
 * Admission is geography-first. Early-career keywords never establish India relevance.
 * India-native boards may keep empty-location postings for JD-level geo checks.
 */
export async function fetchSmartRecruitersJobs(companyId, employer, sourceMeta = {}) {
  const jobs = [];
  let offset = 0;
  const limit = 100;
  const countryRelevance = sourceMeta.countryRelevance || 'india';
  const boardScope = sourceMeta.boardScope || (['Freshworks', 'Swiggy'].includes(companyId) ? 'india-only' : null);

  for (;;) {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyId)}/postings?offset=${offset}&limit=${limit}`;
    const payload = await fetchWithRetry(url);
    const batch = Array.isArray(payload?.content) ? payload.content : [];
    if (!batch.length) break;

    for (const job of batch) {
      const locationRaw = [
        job.location?.city,
        job.location?.region,
        job.location?.country,
        job.location?.remote ? 'Remote' : '',
      ]
        .filter(Boolean)
        .join(', ');

      const pre = shouldIngestJob({
        locationRaw,
        title: job.name || '',
        countryRelevance,
        boardScope,
      });
      if (!pre.keep) continue;

      let descriptionHtml = '';
      try {
        const detail = await fetchWithRetry(
          `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companyId)}/postings/${job.id}`,
        );
        descriptionHtml =
          detail?.jobAd?.sections?.jobDescription?.text ||
          detail?.jobAd?.sections?.qualifications?.text ||
          '';
      } catch {
        descriptionHtml = '';
      }

      const post = shouldIngestJob({
        locationRaw,
        title: job.name || '',
        description: descriptionHtml,
        countryRelevance,
        boardScope,
      });
      if (!post.keep) continue;

      jobs.push({
        externalId: String(job.id),
        title: job.name || 'Untitled',
        company: employer,
        descriptionHtml,
        locationRaw,
        jobUrl:
          job.ref ||
          job.applyUrl ||
          `https://jobs.smartrecruiters.com/${companyId}/${job.id}`,
        source: 'smartrecruiters',
        sourceBoard: companyId,
        postedAt: job.releasedDate || job.createdOn || null,
        employmentTypeHint: job.typeOfEmployment?.label || null,
        raw: job,
      });
    }

    offset += batch.length;
    if (offset >= (payload.totalFound || offset) || batch.length < limit) break;
  }

  return jobs;
}
