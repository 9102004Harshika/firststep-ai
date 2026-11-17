import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

/**
 * Workday public CXS jobs endpoint (POST, limit <= 20).
 * Board config uses boardId = `${hostBase}|${tenant}|${site}` OR structured fields on sourceMeta.
 *
 * Admission is geography-first. Title early-career filter is discovery-only.
 */

const EARLY_TITLE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|university\s+grad|new\s+college\s+grad|graduate\s+(?:trainee|engineer|programme|program|hire|analyst)|entry[-\s]?level|junior|amts)\b/i;

function parseBoard(boardId, sourceMeta = {}) {
  if (sourceMeta.workdayHost && sourceMeta.workdayTenant && sourceMeta.workdaySite) {
    return {
      host: sourceMeta.workdayHost.replace(/\/$/, ''),
      tenant: sourceMeta.workdayTenant,
      site: sourceMeta.workdaySite,
    };
  }
  const [host, tenant, site] = String(boardId || '').split('|');
  if (!host || !tenant || !site) {
    throw new Error(`Invalid Workday boardId (expected host|tenant|site): ${boardId}`);
  }
  return { host: host.replace(/\/$/, ''), tenant, site };
}

async function searchWorkday(host, tenant, site, searchText, offset = 0) {
  const url = `${host}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}/jobs`;
  return fetchWithRetry(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 20,
        offset,
        searchText: searchText || '',
      }),
    },
  );
}

async function fetchDetail(host, tenant, site, externalPath) {
  if (!externalPath) return null;
  const url = `${host}/wday/cxs/${encodeURIComponent(tenant)}/${encodeURIComponent(site)}${externalPath}`;
  try {
    return await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
  } catch {
    return null;
  }
}

export async function fetchWorkdayJobs(boardId, employer, sourceMeta = {}) {
  const { host, tenant, site } = parseBoard(boardId, sourceMeta);
  const countryRelevance = sourceMeta.countryRelevance || 'india-hiring';
  const searches = sourceMeta.workdaySearches || ['Intern', 'Internship', 'Graduate', 'University'];
  const maxPages = Number(sourceMeta.maxPages || 8);

  const seen = new Map();

  for (const searchText of searches) {
    for (let page = 0; page < maxPages; page += 1) {
      let payload;
      try {
        payload = await searchWorkday(host, tenant, site, searchText, page * 20);
      } catch (error) {
        console.warn(`[workday] ${tenant} search failed:`, error.message);
        break;
      }

      const posts = Array.isArray(payload?.jobPostings) ? payload.jobPostings : [];
      if (!posts.length) break;

      for (const post of posts) {
        const title = post.title || '';
        if (!EARLY_TITLE.test(title)) continue;
        const key = post.externalPath || `${title}|${post.locationsText || ''}`;
        if (!seen.has(key)) seen.set(key, post);
      }

      if ((page + 1) * 20 >= Number(payload?.total || 0)) break;
    }
  }

  const detailed = [];
  for (const post of seen.values()) {
    const detail = await fetchDetail(host, tenant, site, post.externalPath);
    const info = detail?.jobPostingInfo || {};
    const locationRaw = [
      info.location,
      post.locationsText,
      info.jobRequisitionLocation?.descriptor,
      info.country?.descriptor,
      post.externalPath || '',
    ]
      .filter(Boolean)
      .join(' | ');

    const descriptionHtml =
      info.jobDescription || titleFallbackDescription(post, employer);
    const decision = shouldIngestJob({
      locationRaw,
      title: info.title || post.title || '',
      description: descriptionHtml,
      countryRelevance,
      boardScope: sourceMeta.boardScope || null,
    });
    if (!decision.keep) continue;

    const jobUrl =
      info.externalUrl ||
      `${host}/${site}${post.externalPath || ''}`;

    detailed.push({
      externalId: String(info.jobReqId || info.id || post.bulletFields?.[0] || post.externalPath),
      title: info.title || post.title || 'Untitled',
      company: employer,
      descriptionHtml,
      locationRaw,
      jobUrl,
      source: 'workday',
      sourceBoard: `${tenant}/${site}`,
      postedAt: info.postedOn || null,
      employmentTypeHint: /\bintern(?:ship)?\b/i.test(info.title || post.title || '')
        ? 'Internship'
        : null,
      raw: { post, info },
    });
  }

  return detailed;
}

function titleFallbackDescription(post, employer) {
  return [
    post.title,
    `Company: ${employer}`,
    post.locationsText ? `Location: ${post.locationsText}` : '',
    'Workday public career posting.',
  ]
    .filter(Boolean)
    .join('\n');
}
