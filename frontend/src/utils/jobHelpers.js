export function getJobId(job) {
  return job?.id ?? job?._id ?? null;
}

export function getCompanyName(job) {
  if (!job) return 'Unknown company';
  if (typeof job.company === 'string') return job.company;
  return job.company?.name || job.companyName || 'Unknown company';
}

export function getCity(job) {
  if (!job) return null;
  if (Array.isArray(job.location?.cities) && job.location.cities.length) {
    return job.location.cities[0];
  }
  if (Array.isArray(job.cities) && job.cities.length) return job.cities[0];
  return (
    job.city ||
    job.location?.city ||
    (typeof job.location === 'string' ? job.location : null) ||
    job.location?.raw ||
    null
  );
}

export function getCities(job) {
  if (Array.isArray(job?.location?.cities) && job.location.cities.length) {
    return job.location.cities;
  }
  const single = getCity(job);
  return single ? [single] : [];
}

export function getLocationLabel(job) {
  const cities = getCities(job);
  if (cities.length) return cities.join(' · ');
  if (isRemoteJob(job)) return 'Remote';
  return null;
}

export function isRemoteJob(job) {
  const blob = `${job?.employmentType || ''} ${job?.location?.raw || ''} ${job?.title || ''} ${getCity(job) || ''}`.toLowerCase();
  return (
    job?.isRemote === true ||
    job?.locationType === 'remote' ||
    job?.employmentType === 'Remote' ||
    /\bremote\b/.test(blob)
  );
}

export function getClassificationStatus(job) {
  const raw = (
    job?.classificationStatus ||
    job?.classification?.status ||
    job?.aiStatus ||
    ''
  )
    .toString()
    .toLowerCase();

  if (['classified', 'complete', 'completed', 'success', 'done'].includes(raw)) {
    return 'classified';
  }
  if (['pending', 'processing', 'queued', 'in_progress'].includes(raw)) {
    return 'pending';
  }
  if (['failed', 'error', 'failure'].includes(raw)) {
    return 'failed';
  }
  if (job?.classified === true || job?.aiClassified === true) return 'classified';
  if (job?.classified === false) return 'pending';
  return 'unknown';
}

export function isUnknownLocation(job) {
  const city = getCity(job);
  if (!city) return true;
  const normalized = city.trim().toLowerCase();
  return (
    normalized === 'unknown' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'not specified'
  );
}

export function isFresherEligible(job) {
  if (typeof job?.fresherEligible === 'boolean') return job.fresherEligible;
  if (typeof job?.isFresherEligible === 'boolean') return job.isFresherEligible;
  const level = (job?.experienceLevel || job?.experience || '').toString().toLowerCase();
  return (
    level.includes('fresher') ||
    level.includes('entry') ||
    level.includes('intern')
  );
}

export function getApplyUrl(job) {
  return (
    job?.jobUrl ||
    job?.applyUrl ||
    job?.applicationUrl ||
    job?.url ||
    job?.sourceUrl ||
    null
  );
}

export function getPostedDate(job) {
  return job?.postedAt || job?.postedDate || job?.publishedAt || job?.createdAt || null;
}

export function daysSincePosted(job) {
  const posted = getPostedDate(job);
  if (!posted) return null;
  const then = new Date(posted).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
}

export function isNewJob(job, withinDays = 7) {
  const days = daysSincePosted(job);
  return days != null && days <= withinDays;
}

export function buildApplicationSummary(job) {
  const cities = getCities(job).join(', ') || getCity(job) || 'Not specified';
  return [
    `Role: ${job?.title || 'Untitled'}`,
    `Company: ${getCompanyName(job)}`,
    `Location: ${cities}`,
    `Experience: ${job?.experienceLevel || 'Unknown'}`,
    `Type: ${job?.employmentType || 'Unknown'}`,
    `Category: ${job?.role || 'Unknown'}`,
    `Apply: ${getApplyUrl(job) || 'N/A'}`,
  ].join('\n');
}

export function extractSkillHints(job) {
  const text = `${job?.title || ''} ${job?.description || ''}`.toLowerCase();
  const catalog = [
    'javascript',
    'typescript',
    'react',
    'node',
    'python',
    'java',
    'sql',
    'aws',
    'azure',
    'docker',
    'kubernetes',
    'figma',
    'excel',
    'tableau',
    'power bi',
    'machine learning',
    'data analysis',
    'communication',
    'salesforce',
  ];
  return catalog.filter((skill) => text.includes(skill)).slice(0, 8);
}

export function normalizeJobsResponse(payload) {
  if (!payload) {
    return { jobs: [], pagination: defaultPagination(), meta: {} };
  }

  const jobs = Array.isArray(payload)
    ? payload
    : payload.data || payload.jobs || payload.items || [];

  const pagination = payload.pagination || {
    page: Number(payload.page) || 1,
    limit: Number(payload.limit) || jobs.length || 20,
    total: Number(payload.total ?? payload.totalCount ?? jobs.length) || 0,
    totalPages:
      Number(payload.totalPages) ||
      Math.max(
        1,
        Math.ceil(
          (Number(payload.total ?? payload.totalCount ?? jobs.length) || 0) /
            (Number(payload.limit) || jobs.length || 20),
        ),
      ),
  };

  return {
    jobs,
    pagination: {
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 20,
      total: Number(pagination.total) || 0,
      totalPages:
        Number(pagination.pages || pagination.totalPages) ||
        Math.max(1, Math.ceil((Number(pagination.total) || 0) / (Number(pagination.limit) || 20))),
    },
    meta: payload.meta || {
      lastUpdated: payload.lastUpdated || payload.updatedAt || null,
    },
  };
}

function defaultPagination() {
  return { page: 1, limit: 20, total: 0, totalPages: 1 };
}

export const ROLE_OPTIONS = [
  'Software Development',
  'Data Science',
  'Machine Learning / AI',
  'Data Analytics',
  'DevOps / Cloud',
  'Product Management',
  'UI/UX Design',
  'Business Development',
  'Marketing',
  'Sales',
  'Finance',
  'Human Resources',
  'Operations',
  'Customer Support',
  'Other',
];

export const CITY_OPTIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Delhi',
  'Gurugram',
  'Noida',
  'Chennai',
  'Kolkata',
  'Remote',
];

export const EXPERIENCE_OPTIONS = [
  { value: 'Internship', label: 'Internship' },
  { value: 'Fresher', label: 'Fresher' },
  { value: 'Entry Level', label: 'Entry Level' },
];

export const EMPLOYMENT_OPTIONS = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Remote', label: 'Remote' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'company', label: 'Company A–Z' },
];

export const QUICK_PRESETS = [
  {
    id: 'internships',
    label: 'Internships',
    patch: { employmentType: 'Internship', experienceLevel: '', fresherEligible: '' },
  },
  {
    id: 'fresher',
    label: 'Fresher eligible',
    patch: { fresherEligible: 'true', employmentType: '', experienceLevel: '' },
  },
  {
    id: 'bengaluru',
    label: 'Bengaluru',
    patch: { city: 'Bengaluru' },
  },
  {
    id: 'remote',
    label: 'Remote',
    patch: { remote: 'true', city: '' },
  },
  {
    id: 'swe',
    label: 'Software',
    patch: { role: 'Software Development' },
  },
  {
    id: 'data',
    label: 'Data / AI',
    patch: { role: 'Data Analytics' },
  },
];

export const APPLY_CHECKLIST = [
  'Skim the JD and highlight 3 matching skills',
  'Customize resume bullet points for this role',
  'Prepare a 4-line cover note / LinkedIn message',
  'Open the official apply link and submit today',
  'Log the application in your tracker',
];
