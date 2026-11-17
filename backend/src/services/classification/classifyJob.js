import {
  CLASSIFICATION_PROMPT,
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  ROLE_TAXONOMY,
} from '../../config/constants.js';
import { env } from '../../config/env.js';
import { classificationOutputSchema } from '../../validators/jobSchemas.js';
import { normalizeCityName } from '../../utils/cities.js';
import { contentHash } from '../../utils/text.js';
import { completeChat } from './providers/index.js';

function estimateCost(inputTokens, outputTokens) {
  const inCost = (inputTokens / 1_000_000) * env.llm.pricing.inputPerMTok;
  const outCost = (outputTokens / 1_000_000) * env.llm.pricing.outputPerMTok;
  return Number((inCost + outCost).toFixed(8));
}

function extractJson(text) {
  if (!text) throw new Error('Empty LLM response');
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in LLM response');
    return JSON.parse(match[0]);
  }
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9\s+.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ROLE_ALIASES = {
  'software development': 'Software Development',
  'software engineer': 'Software Development',
  'software engineering': 'Software Development',
  swe: 'Software Development',
  sde: 'Software Development',
  developer: 'Software Development',
  engineering: 'Software Development',
  backend: 'Software Development',
  frontend: 'Software Development',
  fullstack: 'Software Development',
  'full stack': 'Software Development',
  mobile: 'Software Development',
  'data science': 'Data Science',
  'data scientist': 'Data Science',
  'machine learning / ai': 'Machine Learning / AI',
  'machine learning': 'Machine Learning / AI',
  ml: 'Machine Learning / AI',
  ai: 'Machine Learning / AI',
  'ai engineer': 'Machine Learning / AI',
  'data analytics': 'Data Analytics',
  'data analyst': 'Data Analytics',
  analytics: 'Data Analytics',
  bi: 'Data Analytics',
  'devops / cloud': 'DevOps / Cloud',
  devops: 'DevOps / Cloud',
  sre: 'DevOps / Cloud',
  cloud: 'DevOps / Cloud',
  cybersecurity: 'Cybersecurity',
  security: 'Cybersecurity',
  'product management': 'Product Management',
  'product manager': 'Product Management',
  pm: 'Product Management',
  'ui/ux design': 'UI/UX Design',
  'ui ux design': 'UI/UX Design',
  'ux design': 'UI/UX Design',
  'ui design': 'UI/UX Design',
  'product design': 'UI/UX Design',
  design: 'UI/UX Design',
  'business development': 'Business Development',
  bd: 'Business Development',
  marketing: 'Marketing',
  sales: 'Sales',
  finance: 'Finance',
  'human resources': 'Human Resources',
  hr: 'Human Resources',
  operations: 'Operations',
  'customer support': 'Customer Support',
  support: 'Customer Support',
  other: 'Other',
  unknown: 'Unknown',
};

const EXPERIENCE_ALIASES = {
  internship: 'Internship',
  intern: 'Internship',
  'intern level': 'Internship',
  fresher: 'Fresher',
  freshman: 'Fresher',
  'new grad': 'Fresher',
  'new graduate': 'Fresher',
  graduate: 'Fresher',
  campus: 'Fresher',
  trainee: 'Fresher',
  '0 yoe': 'Fresher',
  '0 years': 'Fresher',
  'entry level': 'Entry Level',
  'entry-level': 'Entry Level',
  entrylevel: 'Entry Level',
  junior: 'Entry Level',
  associate: 'Entry Level',
  experienced: 'Experienced',
  mid: 'Experienced',
  'mid level': 'Experienced',
  senior: 'Experienced',
  staff: 'Experienced',
  lead: 'Experienced',
  unknown: 'Unknown',
};

const EMPLOYMENT_ALIASES = {
  'full-time': 'Full-time',
  'full time': 'Full-time',
  fulltime: 'Full-time',
  permanent: 'Full-time',
  'part-time': 'Part-time',
  'part time': 'Part-time',
  parttime: 'Part-time',
  internship: 'Internship',
  intern: 'Internship',
  contract: 'Contract',
  contractor: 'Contract',
  temporary: 'Contract',
  freelance: 'Contract',
  remote: 'Remote',
  'work from home': 'Remote',
  wfh: 'Remote',
  unknown: 'Unknown',
};

function mapEnum(value, allowed, aliases, fallback = 'Unknown') {
  if (value == null || value === '') return fallback;
  const raw = String(value).trim();
  if (allowed.includes(raw)) return raw;
  const aliased = aliases[normalizeKey(raw)];
  if (aliased && allowed.includes(aliased)) return aliased;
  // soft contain match against allowed labels
  const key = normalizeKey(raw);
  for (const option of allowed) {
    if (normalizeKey(option) === key) return option;
  }
  return fallback;
}

function inferRoleFromTitle(title = '') {
  const t = normalizeKey(title);
  if (!t) return null;
  if (/\b(product design|ui|ux|designer)\b/.test(t)) return 'UI/UX Design';
  if (/\b(data scientist)\b/.test(t)) return 'Data Science';
  if (/\b(machine learning| ml |ai engineer|llm)\b/.test(t)) return 'Machine Learning / AI';
  if (/\b(data analyst|analytics|bi )\b/.test(t)) return 'Data Analytics';
  if (/\b(devops|sre|site reliability|cloud engineer)\b/.test(t)) return 'DevOps / Cloud';
  if (/\b(security|cyber)\b/.test(t)) return 'Cybersecurity';
  if (/\b(product manager|product management|\bpm\b)\b/.test(t)) return 'Product Management';
  if (/\b(software|sde|swe|engineer|developer|backend|frontend|full.?stack)\b/.test(t)) {
    return 'Software Development';
  }
  if (/\b(marketing)\b/.test(t)) return 'Marketing';
  if (/\b(sales)\b/.test(t)) return 'Sales';
  if (/\b(finance|accountant)\b/.test(t)) return 'Finance';
  if (/\b(human resources|\bhr\b)\b/.test(t)) return 'Human Resources';
  return null;
}

function calibrateConfidence(parsed, cities) {
  let confidence =
    typeof parsed.confidence === 'number' && !Number.isNaN(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.55;

  const evidence = String(parsed.evidence || '').trim();
  if (evidence.length < 20) confidence = Math.min(confidence, 0.65);
  if (evidence.length > 80) confidence = Math.min(1, confidence + 0.05);
  if (parsed.role === 'Unknown') confidence = Math.min(confidence, 0.45);
  if (parsed.role !== 'Unknown' && evidence.length >= 40) {
    confidence = Math.min(1, Math.max(confidence, 0.62));
  }
  if (!cities.length && parsed.experienceLevel === 'Unknown') {
    confidence = Math.min(confidence, 0.5);
  }
  if (
    parsed.fresherEligible === true &&
    ['Internship', 'Fresher', 'Entry Level'].includes(parsed.experienceLevel)
  ) {
    confidence = Math.min(1, confidence + 0.04);
  }
  if (parsed.fresherEligible == null && parsed.experienceLevel === 'Unknown') {
    confidence = Math.min(confidence, 0.55);
  }
  return Number(confidence.toFixed(3));
}

export function sanitizeClassification(parsed, { title = '' } = {}) {
  let role = mapEnum(parsed.role, ROLE_TAXONOMY, ROLE_ALIASES, 'Unknown');
  if (role === 'Unknown') {
    role = inferRoleFromTitle(title) || 'Unknown';
  }

  const experienceLevel = mapEnum(
    parsed.experienceLevel,
    EXPERIENCE_LEVELS,
    EXPERIENCE_ALIASES,
    'Unknown',
  );
  const employmentType = mapEnum(
    parsed.employmentType,
    EMPLOYMENT_TYPES,
    EMPLOYMENT_ALIASES,
    'Unknown',
  );

  const cities = Array.isArray(parsed.cities)
    ? [...new Set(parsed.cities.map(normalizeCityName).filter(Boolean))]
    : [];

  let fresherEligible =
    parsed.fresherEligible === true || parsed.fresherEligible === false
      ? parsed.fresherEligible
      : null;

  if (fresherEligible == null) {
    if (experienceLevel === 'Internship' || experienceLevel === 'Fresher') {
      fresherEligible = true;
    } else if (experienceLevel === 'Experienced') {
      fresherEligible = false;
    }
  }

  const draft = {
    role,
    cities,
    experienceLevel,
    employmentType,
    fresherEligible,
    confidence: parsed.confidence,
    evidence: String(parsed.evidence || '').slice(0, 500),
  };

  return classificationOutputSchema.parse({
    ...draft,
    confidence: calibrateConfidence(draft, cities),
  });
}

export function buildJobPrompt(job) {
  // Keep prompt compact: title/location first, then a truncated description.
  // This improves signal density and lowers token spend.
  const description = String(job.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3200);

  return `Classify this India-market job posting.

Title: ${job.title}
Company: ${job.company}
Location raw: ${job.location?.raw || 'Unknown'}
Known cities hint: ${(job.location?.cities || []).join(', ') || 'none'}

Description:
${description || 'No description provided.'}

Return JSON only. Use exact enum spellings from the system prompt.
Prefer Unknown / null over guessing.`;
}

export async function classifyJobRecord(job, { force = false } = {}) {
  const hash = contentHash([
    job.title,
    job.company,
    job.location?.raw,
    job.description?.slice(0, 2000),
  ]);

  if (
    !force &&
    job.classification?.status === 'classified' &&
    job.classification?.contentHash === hash &&
    job.classification?.promptVersion === env.llm.promptVersion
  ) {
    return { skipped: true, reason: 'unchanged' };
  }

  const system = CLASSIFICATION_PROMPT;
  const user = buildJobPrompt(job);

  let lastError;
  let totalInput = 0;
  let totalOutput = 0;
  let lastProvider = env.llm.provider;
  let lastModel =
    env.llm.provider === 'openai'
      ? env.llm.openaiModel || 'gpt-4o-mini'
      : env.llm.model;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const completion = await completeChat({ system, user });
      totalInput += completion.inputTokens;
      totalOutput += completion.outputTokens;
      lastProvider = completion.provider;
      lastModel = completion.model;

      const parsed = extractJson(completion.text);
      const classified = sanitizeClassification(parsed, { title: job.title });
      const cost = estimateCost(totalInput, totalOutput);

      return {
        skipped: false,
        result: classified,
        meta: {
          provider: lastProvider,
          model: lastModel,
          promptVersion: env.llm.promptVersion,
          inputTokens: totalInput,
          outputTokens: totalOutput,
          estimatedCost: cost,
          contentHash: hash,
          attempts: attempt + 1,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    skipped: false,
    failed: true,
    error: lastError?.message || 'Classification failed',
    meta: {
      provider: lastProvider,
      model: lastModel,
      promptVersion: env.llm.promptVersion,
      inputTokens: totalInput,
      outputTokens: totalOutput,
      estimatedCost: estimateCost(totalInput, totalOutput),
      contentHash: hash,
    },
  };
}
