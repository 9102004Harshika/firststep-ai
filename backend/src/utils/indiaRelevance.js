import { CITY_ALIASES, INDIAN_CITIES } from '../config/constants.js';

/** Cities used for India geo matching — Remote is NOT a city. */
export const INDIA_GEO_CITIES = INDIAN_CITIES.filter((c) => c !== 'Remote');

const EARLY_CAREER_RE =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|entry[-\s]?level|junior|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program)|0\s*[-–]\s*1\s*years?)\b/i;

/** Exclude false positives like "undergraduate". */
const EARLY_CAREER_EXCLUDE_RE = /\bunder\s*graduate\b/i;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWordBoundary(haystack, needle) {
  if (!haystack || !needle) return false;
  const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(needle)}(?:$|[^a-z0-9])`, 'i');
  return re.test(haystack);
}

/**
 * Extract India taxonomy cities with word-boundary matching.
 * Never treats "Remote" as an Indian city.
 */
export function extractIndianCities(text, { includeRemote = false } = {}) {
  if (!text) return [];
  const found = new Set();
  const lower = String(text);

  for (const city of INDIA_GEO_CITIES) {
    if (hasWordBoundary(lower, city)) {
      found.add(city === 'New Delhi' ? 'Delhi' : city);
    }
  }
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (alias === 'remote') continue;
    if (hasWordBoundary(lower, alias)) found.add(canonical);
  }

  if (includeRemote && hasWordBoundary(lower, 'remote')) {
    // Only as employment mode annotation — not an India city by itself.
  }

  return [...found];
}

export function normalizeCityName(value) {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  if (lower === 'remote') return null;
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];
  const exact = INDIA_GEO_CITIES.find((city) => city.toLowerCase() === lower);
  if (exact) return exact === 'New Delhi' ? 'Delhi' : exact;
  return extractIndianCities(cleaned)[0] || null;
}

function locationHasExplicitIndia(locationRaw = '') {
  const loc = String(locationRaw);
  if (/\b(?:republic of )?india\b/i.test(loc)) return true;
  if (/\b(bharat|hindustan)\b/i.test(loc)) return true;

  // US state abbreviation trap: "Plainfield, IN" / "Greenfield, IN 46140"
  // must NOT count as India country code.
  if (/,\s*IN(\s+\d{5}(-\d{4})?)?$/i.test(loc.trim())) {
    return false;
  }
  if (/\bindiana\b/i.test(loc)) {
    return false;
  }

  // ISO-ish country token IN only in structured multi-segment locations
  // e.g. "Bengaluru | IN" or "IN - Hyderabad" — never bare "City, IN".
  if (/(^|[|/(-])\s*IN\s*([|/)-]|$)/i.test(loc)) return true;
  if (/\bIN\s*[-–]\s*[A-Za-z]/i.test(loc) && extractIndianCities(loc).length > 0) {
    return true;
  }
  return false;
}

function descriptionHasIndiaEligibility(description = '') {
  const text = String(description);
  // Strict eligibility phrases — not generic "customers in India" alone.
  const patterns = [
    /\b(?:based|located|office|headquartered|hq)\s+in\s+india\b/i,
    /\b(?:remote(?:\s*[-–,]?\s*)?(?:in|from|across)\s+india|india[-\s]?based\s+remote|work\s+from\s+india)\b/i,
    /\b(?:open\s+to|hiring)\s+(?:candidates|talent|applicants)\s+(?:in|from|across)\s+india\b/i,
    /\bemployment\s+(?:in|for)\s+india\b/i,
    /\bindia\s+(?:office|location|team|entity)\b/i,
  ];
  return patterns.some((re) => re.test(text));
}

/**
 * Canonical India geography evaluation.
 * Early-career keywords NEVER establish indiaRelevant.
 */
export function evaluateIndiaGeography({
  locationRaw = '',
  description = '',
  title = '',
  company = '',
} = {}) {
  const locationCities = extractIndianCities(`${locationRaw} ${title}`);
  const locIndia = locationHasExplicitIndia(locationRaw);
  const remoteInLocation = /\bremote\b/i.test(locationRaw);
  const descEligible = descriptionHasIndiaEligibility(description);

  if (locationCities.length) {
    const type =
      locIndia && remoteInLocation
        ? 'india_remote'
        : locationCities.length > 1
          ? 'multi_location'
          : 'city';
    return {
      indiaRelevant: true,
      geographicEvidence: {
        type,
        matchedText: locationCities.join(', ') + (locIndia ? ' + India' : ''),
        confidence: locIndia ? 0.98 : 0.92,
        sourceField: 'location',
      },
      cities: locationCities,
      country: 'India',
      exclusionReason: null,
    };
  }

  if (locIndia) {
    return {
      indiaRelevant: true,
      geographicEvidence: {
        type: remoteInLocation ? 'india_remote' : 'country',
        matchedText: String(locationRaw).slice(0, 120),
        confidence: 0.95,
        sourceField: 'location',
      },
      cities: [],
      country: 'India',
      exclusionReason: null,
    };
  }

  // Remote + explicit India eligibility in description (not generic company copy).
  if ((remoteInLocation || /\bremote\b/i.test(description.slice(0, 800))) && descEligible) {
    return {
      indiaRelevant: true,
      geographicEvidence: {
        type: 'india_remote',
        matchedText: 'Remote + India eligibility phrase',
        confidence: 0.85,
        sourceField: 'description',
      },
      cities: [],
      country: 'India',
      exclusionReason: null,
    };
  }

  if (descEligible && !locationRaw) {
    return {
      indiaRelevant: true,
      geographicEvidence: {
        type: 'country',
        matchedText: 'India eligibility in description (location empty)',
        confidence: 0.7,
        sourceField: 'description',
      },
      cities: [],
      country: 'India',
      exclusionReason: null,
    };
  }

  // Bare "India" only in long company/about description — NOT enough.
  const overseas =
    /\b(united states|usa|u\.s\.|san francisco|new york|seattle|london|berlin|toronto|dublin|amsterdam|singapore|australia|europe|emea|americas)\b/i.test(
      locationRaw,
    );

  return {
    indiaRelevant: false,
    geographicEvidence: {
      type: 'unknown',
      matchedText: '',
      confidence: 0,
      sourceField: 'none',
    },
    cities: [],
    country: overseas ? 'Overseas' : remoteInLocation ? 'Remote' : 'Unknown',
    exclusionReason: overseas
      ? 'overseas_location_without_india_evidence'
      : remoteInLocation
        ? 'remote_without_india_eligibility'
        : 'insufficient_india_geography',
  };
}

export function isIndiaRelevant(input) {
  return evaluateIndiaGeography(input).indiaRelevant;
}

export function isEarlyCareerSignal(text = '') {
  if (!text) return false;
  if (EARLY_CAREER_EXCLUDE_RE.test(text)) return false;
  return EARLY_CAREER_RE.test(text);
}

/**
 * Adapter admission: geography first. Early-career is never a substitute for India.
 * For india-only boards we still require geo evidence unless boardScope is india-only
 * AND location is empty (rare) — prefer filtering.
 */
export function shouldIngestJob({
  locationRaw = '',
  title = '',
  description = '',
  countryRelevance = 'unknown',
  boardScope = null,
} = {}) {
  const geo = evaluateIndiaGeography({ locationRaw, title, description });
  if (geo.indiaRelevant) return { keep: true, reason: 'india_geography', geo };

  // Even "india" priority boards must not ingest clear overseas-only roles.
  if (boardScope === 'india-only' && !locationRaw) {
    // Unknown location on an India-native board — keep for normalize to decide with JD.
    return { keep: true, reason: 'india_board_unknown_location', geo };
  }

  if (countryRelevance === 'india' && !geo.exclusionReason?.startsWith('overseas')) {
    // Soft: if location empty, keep; if overseas, drop.
    if (!locationRaw) return { keep: true, reason: 'india_board_empty_location', geo };
    if (geo.country === 'Overseas') return { keep: false, reason: 'overseas_on_india_board', geo };
  }

  return { keep: false, reason: geo.exclusionReason || 'not_india_relevant', geo };
}
