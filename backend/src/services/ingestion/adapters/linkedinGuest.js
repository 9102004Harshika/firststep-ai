import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

/**
 * LinkedIn public jobs-guest endpoints (no login).
 * Used to discover India early-career openings; application URL is the
 * public LinkedIn job view (employer apply flow).
 *
 * Geography-first: early-career keywords never establish India relevance.
 */

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const EARLY_TITLE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program|hire|analyst)|entry[-\s]?level|junior|management\s+trainee|analyst\s+trainee)\b/i;

const DEFAULT_QUERIES = [
  'software engineer intern India',
  'software development intern Bangalore',
  'data science intern India',
  'data analyst intern India',
  'machine learning intern Bangalore',
  'graduate engineer trainee India',
  'graduate trainee India',
  'campus hiring software India',
  'fresher software engineer India',
  'internship Hyderabad',
  'internship Pune',
  'internship Mumbai',
  'internship Chennai',
  'internship Gurugram',
  'analyst trainee India',
  'apprentice software India',
  'junior software engineer India',
  'SDE intern India',
  'product management intern India',
  'UI UX intern Bangalore',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html = '') {
  return decodeHtml(String(html).replace(/<[^>]+>/g, ' '));
}

async function fetchText(url) {
  return fetchWithRetry(
    url,
    {
      headers: {
        Accept: 'text/html',
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    },
    { retryOn: [408, 429, 500, 502, 503, 504], maxRetries: 3 },
  );
}

function parseSearchHtml(html) {
  const ids = [...html.matchAll(/data-entity-urn="urn:li:jobPosting:(\d+)"/g)].map((m) => m[1]);
  const titles = [...html.matchAll(/class="base-search-card__title">\s*([^<]+)/g)].map((m) =>
    decodeHtml(m[1]),
  );
  const companies = [
    ...html.matchAll(/class="hidden-nested-link"[^>]*>\s*([^<]+)/g),
  ].map((m) => decodeHtml(m[1]));
  const locations = [
    ...html.matchAll(/class="job-search-card__location">\s*([^<]+)/g),
  ].map((m) => decodeHtml(m[1]));

  const rows = [];
  for (let i = 0; i < ids.length; i += 1) {
    rows.push({
      id: ids[i],
      title: titles[i] || 'Untitled',
      company: companies[i] || 'Unknown employer',
      locationRaw: locations[i] || 'India',
    });
  }
  return rows;
}

async function fetchDetail(id) {
  const html = await fetchText(
    `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${encodeURIComponent(id)}`,
  );
  if (typeof html !== 'string') return null;

  const title =
    decodeHtml((html.match(/class="top-card-layout__title[^"]*"[^>]*>([^<]+)/) || [])[1] || '') ||
    null;
  const company =
    decodeHtml(
      (html.match(/class="topcard__org-name-link[^"]*"[^>]*>([^<]+)/) || [])[1] || '',
    ) || null;
  const locationRaw =
    decodeHtml(
      (html.match(/class="topcard__flavor topcard__flavor--bullet"[^>]*>\s*([^<]+)/) || [])[1] ||
        '',
    ) || null;
  const descriptionHtml =
    (html.match(/class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] ||
    '';

  return {
    title,
    company,
    locationRaw,
    descriptionHtml: descriptionHtml || stripTags(descriptionHtml),
  };
}

export async function fetchLinkedInGuestJobs(_boardId, employer, sourceMeta = {}) {
  const countryRelevance = sourceMeta.countryRelevance || 'india';
  const queries = sourceMeta.linkedinQueries || DEFAULT_QUERIES;
  const maxJobs = Number(sourceMeta.maxJobs || 180);
  const pagesPerQuery = Number(sourceMeta.pagesPerQuery || 3);
  const pageSize = 10;

  const discovered = new Map();

  for (const query of queries) {
    for (let page = 0; page < pagesPerQuery; page += 1) {
      const start = page * pageSize;
      const url =
        `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search` +
        `?keywords=${encodeURIComponent(query)}` +
        `&location=${encodeURIComponent('India')}` +
        `&f_TPR=r2592000` +
        `&start=${start}`;

      let html;
      try {
        html = await fetchText(url);
        await sleep(700 + Math.floor(Math.random() * 400));
      } catch (error) {
        console.warn(`[linkedinGuest] search failed q=${query} start=${start}:`, error.message);
        break;
      }
      if (typeof html !== 'string') break;

      const rows = parseSearchHtml(html);
      if (!rows.length) break;

      for (const row of rows) {
        if (!EARLY_TITLE.test(row.title)) continue;
        const pre = shouldIngestJob({
          locationRaw: row.locationRaw,
          title: row.title,
          countryRelevance,
          boardScope: sourceMeta.boardScope || 'linkedin-india-early',
        });
        if (!pre.keep) continue;
        if (!discovered.has(row.id)) discovered.set(row.id, row);
      }

      if (discovered.size >= maxJobs * 2) break;
    }
    if (discovered.size >= maxJobs * 2) break;
  }

  const selected = [];
  for (const row of discovered.values()) {
    if (selected.length >= maxJobs) break;

    let detail = null;
    try {
      detail = await fetchDetail(row.id);
      await sleep(500 + Math.floor(Math.random() * 300));
    } catch (error) {
      console.warn(`[linkedinGuest] detail failed ${row.id}:`, error.message);
    }

    const title = detail?.title || row.title;
    const company = detail?.company || row.company || employer;
    const locationRaw = detail?.locationRaw || row.locationRaw || 'India';
    const descriptionHtml =
      detail?.descriptionHtml ||
      `${title}\nCompany: ${company}\nLocation: ${locationRaw}\nLinkedIn public job posting.`;

    if (!EARLY_TITLE.test(title)) continue;

    const decision = shouldIngestJob({
      locationRaw,
      title,
      description: stripTags(descriptionHtml),
      countryRelevance,
      boardScope: sourceMeta.boardScope || 'linkedin-india-early',
    });
    if (!decision.keep) continue;

    selected.push({
      externalId: String(row.id),
      title,
      company,
      descriptionHtml,
      locationRaw,
      jobUrl: `https://www.linkedin.com/jobs/view/${row.id}`,
      source: 'linkedin',
      sourceBoard: 'jobs-guest-india-early',
      postedAt: null,
      employmentTypeHint: /\bintern(?:ship)?\b/i.test(title) ? 'Internship' : null,
      raw: {
        discovery: 'linkedin-jobs-guest',
        searchRow: row,
        detailFetched: Boolean(detail),
      },
    });
  }

  return selected;
}
