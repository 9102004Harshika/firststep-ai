import { rawJobSchema } from '../../../validators/jobSchemas.js';
import { canonicalizeUrl } from '../../../utils/url.js';
import {
  fingerprintFrom,
  normalizeCompany,
  normalizeTitle,
  stripHtml,
  normalizeWhitespace,
} from '../../../utils/text.js';
import { evaluateIndiaGeography, normalizeCityName } from '../../../utils/indiaRelevance.js';

function guessEmploymentType(hint, title, description) {
  const blob = `${hint || ''} ${title} ${description}`.toLowerCase();
  if (/\bintern(ship)?\b/.test(blob)) return 'Internship';
  if (/\bpart[-\s]?time\b/.test(blob)) return 'Part-time';
  if (/\bcontract|freelance|consultant\b/.test(blob)) return 'Contract';
  if (/\bremote\b/.test(blob) && !/\bfull[-\s]?time\b/.test(blob)) return 'Remote';
  if (/\bfull[-\s]?time\b/.test(blob)) return 'Full-time';
  return 'Unknown';
}

function guessExperience(title, description) {
  const blob = `${title} ${description}`.toLowerCase();
  if (/\bintern(ship)?\b/.test(blob)) return 'Internship';
  if (/\bfresher|campus|graduate programme|graduate program|new grad\b/.test(blob)) return 'Fresher';
  if (/\bentry[-\s]?level|junior|associate engineer|0-1 year|0–1 year\b/.test(blob)) {
    return 'Entry Level';
  }
  if (/\b(senior|staff|principal|lead|manager|\d+\+?\s*years?)\b/.test(blob)) {
    return 'Experienced';
  }
  return 'Unknown';
}

export function normalizeJob(rawInput) {
  const parsed = rawJobSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join('; '),
      raw: rawInput,
    };
  }

  const raw = parsed.data;
  let canonicalUrl;
  try {
    canonicalUrl = canonicalizeUrl(raw.jobUrl);
  } catch (error) {
    return { ok: false, error: error.message, raw: rawInput };
  }

  const description = stripHtml(raw.descriptionHtml || '');
  const title = normalizeTitle(raw.title);
  const company = normalizeCompany(raw.company) || raw.company;
  const locationRaw = normalizeWhitespace(raw.locationRaw || '');

  const geo = evaluateIndiaGeography({
    locationRaw,
    description,
    title,
    company,
  });

  const cities = [...new Set((geo.cities || []).map(normalizeCityName).filter(Boolean))];
  const country = geo.country || 'Unknown';

  const employmentType = guessEmploymentType(raw.employmentTypeHint, title, description);
  const experienceLevel = guessExperience(title, description);
  const fingerprint = fingerprintFrom({ company, title, locationRaw });

  let postedAt = null;
  if (raw.postedAt) {
    const d = new Date(raw.postedAt);
    if (!Number.isNaN(d.getTime())) postedAt = d;
  }

  return {
    ok: true,
    job: {
      externalId: raw.externalId,
      title,
      company,
      description,
      descriptionHtml: raw.descriptionHtml || '',
      location: {
        raw: locationRaw,
        cities,
        country,
      },
      jobUrl: raw.jobUrl,
      canonicalUrl,
      source: raw.source,
      sourceBoard: raw.sourceBoard,
      sourceRefs: [
        {
          source: raw.source,
          sourceBoard: raw.sourceBoard,
          externalId: raw.externalId,
          jobUrl: raw.jobUrl,
        },
      ],
      employmentType,
      experienceLevel,
      role: 'Unknown',
      fresherEligible: null,
      salary: { raw: null },
      postedAt,
      status: 'active',
      fingerprint,
      raw: raw.raw || rawInput,
      indiaRelevant: geo.indiaRelevant,
      geographicEvidence: geo.geographicEvidence,
      geoExclusionReason: geo.exclusionReason || null,
      classification: {
        status: 'pending',
      },
    },
  };
}
