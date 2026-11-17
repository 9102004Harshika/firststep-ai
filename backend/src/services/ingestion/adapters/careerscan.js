import { fetchWithRetry } from '../../../utils/http.js';
import { shouldIngestJob } from '../../../utils/indiaRelevance.js';

/**
 * Careerscan India discovery adapter.
 *
 * Careerscan aggregates employer career pages. We use it only to discover
 * India early-career openings, then store the employer's original apply URL
 * (Greenhouse / Lever / Ashby / SmartRecruiters / Workday / Keka / Zoho / etc.).
 *
 * Geography-first: early-career keywords never establish India relevance.
 */

const EARLY_TITLE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program|hire|analyst)|entry[-\s]?level|junior|management\s+trainee|analyst\s+trainee)\b/i;

const EARLY_EXPERIENCE = new Set([
  'fresher',
  'internship',
  'intern',
  'entry',
  '0-1 yrs',
  '0-2 yrs',
  'fresher (0-1 yr)',
]);

const QUERY_SET = [
  'internship',
  'intern',
  'fresher',
  'graduate trainee',
  'graduate engineer',
  'campus',
  'apprentice',
  'software intern',
  'data intern',
  'engineering intern',
  'sde intern',
  'software engineer intern',
  'analyst trainee',
  'junior software',
];

const SKIP_HREF =
  /careerscan\.in|google\.com|facebook\.com|twitter\.com|x\.com|yandex|linkedin\.com\/sharing|schemas\.org|w3\.org|mc\.yandex|favicon/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEarlyCareerListing(job) {
  const title = job.title || '';
  const exp = String(job.experience || job.expLabel || '').toLowerCase();
  if (/\b(senior|staff|principal|director|manager|lead)\b/i.test(title) && !EARLY_TITLE.test(title)) {
    return false;
  }
  if (EARLY_TITLE.test(title)) return true;
  if (EARLY_EXPERIENCE.has(exp)) return true;
  return false;
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function listPage(query, page) {
  const url = `https://careerscan.in/api/jobs?q=${encodeURIComponent(query)}&limit=50&page=${page}`;
  const payload = await fetchWithRetry(url, {
    headers: { Accept: 'application/json', 'User-Agent': BROWSER_UA },
  });
  return {
    jobs: Array.isArray(payload?.jobs) ? payload.jobs : [],
    total: Number(payload?.total || 0),
  };
}

function extractApplyUrl(html) {
  const hrefs = [...html.matchAll(/href="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]);
  const external = [...new Set(hrefs.filter((h) => !SKIP_HREF.test(h)))];

  const preferred = external.find((h) =>
    /(greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|myworkdayjobs\.com|recruitee\.com|keka\.com|zohorecruit|workable\.com|taleo\.net|successfactors|icims\.com|jobvite\.com|bamboohr\.com|pinpointhq\.com|careers\.|jobs\.)/i.test(
      h,
    ),
  );
  if (preferred) return preferred;

  const embedded = html.match(/applyUrl\\?":\\?"(https?:\\?\/\\?\/[^"\\]+)/i);
  if (embedded?.[1]) {
    return embedded[1].replace(/\\\//g, '/');
  }

  return external.find((h) => !/\.(png|jpg|jpeg|svg|webp|gif)(\?|$)/i.test(h)) || null;
}

function extractDescription(html, listing) {
  const desc = html.match(/description\\":\\"(.*?)\\",\\"benefits\\"/s);
  if (desc?.[1] && !/^\$\d+$/.test(desc[1])) {
    try {
      return JSON.parse(`"${desc[1]}"`);
    } catch {
      return desc[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }

  const parts = [
    listing.title,
    listing.company?.name ? `Company: ${listing.company.name}` : '',
    listing.location ? `Location: ${listing.location}` : '',
    listing.experience ? `Experience label: ${listing.experience}` : '',
    listing.category ? `Category: ${listing.category}` : '',
    'Original employer application link preserved from CareerScan discovery.',
  ].filter(Boolean);
  return parts.join('\n');
}

async function resolveListing(listing) {
  const pageUrl = `https://careerscan.in/jobs/${encodeURIComponent(listing.slug)}`;
  const html = await fetchWithRetry(
    pageUrl,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://careerscan.in/',
      },
    },
    { retryOn: [408, 429, 500, 502, 503, 504], maxRetries: 2 },
  );

  if (typeof html !== 'string') return null;
  if (/Just a moment|cf-browser-verification|Cloudflare/i.test(html) && !/applyUrl/i.test(html)) {
    throw new Error('Careerscan Cloudflare challenge');
  }
  const applyUrl = extractApplyUrl(html);
  if (!applyUrl || /careerscan\.in/i.test(applyUrl)) return null;

  return {
    applyUrl,
    descriptionHtml: extractDescription(html, listing),
  };
}

export async function fetchCareerscanJobs(_boardId, employer, sourceMeta = {}) {
  const countryRelevance = sourceMeta.countryRelevance || 'india';
  const boardScope = sourceMeta.boardScope || 'india-early-discovery';
  const maxJobs = Number(sourceMeta.maxJobs || 220);
  const maxPagesPerQuery = Number(sourceMeta.maxPagesPerQuery || 3);

  const discovered = new Map();

  for (const query of QUERY_SET) {
    for (let page = 1; page <= maxPagesPerQuery; page += 1) {
      let batch;
      try {
        batch = await listPage(query, page);
      } catch (error) {
        console.warn(`[careerscan] list failed q=${query} page=${page}:`, error.message);
        break;
      }

      if (!batch.jobs.length) break;

      for (const job of batch.jobs) {
        if (!job?.id || !job?.slug || !job?.title) continue;
        if (!isEarlyCareerListing(job)) continue;

        const locationRaw = [job.location, job.city, job.state].filter(Boolean).join(', ');
        const pre = shouldIngestJob({
          locationRaw,
          title: job.title,
          countryRelevance,
          boardScope,
        });
        if (!pre.keep) continue;

        if (!discovered.has(job.id)) {
          discovered.set(job.id, job);
        }
      }

      if (page * 50 >= batch.total) break;
      await sleep(120);
    }
    if (discovered.size >= maxJobs * 2) break;
  }

  const selected = [];
  for (const listing of discovered.values()) {
    if (selected.length >= maxJobs) break;

    const locationRaw = [listing.location, listing.city, listing.state].filter(Boolean).join(', ');
    let resolved;
    try {
      resolved = await resolveListing(listing);
      await sleep(80);
    } catch (error) {
      console.warn(`[careerscan] resolve failed ${listing.slug}:`, error.message);
      continue;
    }
    if (!resolved) continue;

    const decision = shouldIngestJob({
      locationRaw,
      title: listing.title,
      description: resolved.descriptionHtml,
      countryRelevance,
      boardScope,
    });
    if (!decision.keep) continue;

    selected.push({
      externalId: String(listing.id),
      title: listing.title,
      company: listing.company?.name || employer || 'Unknown employer',
      descriptionHtml: resolved.descriptionHtml,
      locationRaw,
      jobUrl: resolved.applyUrl,
      source: 'careerscan',
      sourceBoard: 'india-early',
      postedAt: listing.postedAt || listing.createdAt || null,
      employmentTypeHint: /\bintern(?:ship)?\b/i.test(listing.title)
        ? 'Internship'
        : null,
      raw: {
        discovery: 'careerscan',
        listing,
        applyUrl: resolved.applyUrl,
        careerscanUrl: `https://careerscan.in/jobs/${listing.slug}`,
      },
    });
  }

  return selected;
}
