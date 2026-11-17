import { api } from './api.js';
import { normalizeJobsResponse } from '../utils/jobHelpers.js';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }),
  );
}

export async function fetchJobs(filters = {}) {
  const {
    search,
    role,
    city,
    experienceLevel,
    employmentType,
    fresherEligible,
    earlyCareer,
    indiaRelevant,
    remote,
    page = 1,
    limit = 12,
    sort = 'newest',
  } = filters;

  const { data } = await api.get('/jobs', {
    params: cleanParams({
      search,
      role,
      city,
      experienceLevel,
      employmentType,
      fresherEligible:
        fresherEligible === true || fresherEligible === 'true'
          ? 'true'
          : fresherEligible === false || fresherEligible === 'false'
            ? 'false'
            : undefined,
      earlyCareer:
        earlyCareer === true || earlyCareer === 'true' ? 'true' : undefined,
      indiaRelevant:
        indiaRelevant === true || indiaRelevant === 'true' ? 'true' : undefined,
      remote: remote === true || remote === 'true' ? 'true' : undefined,
      page,
      limit,
      sort,
    }),
  });

  return normalizeJobsResponse(data);
}

export async function fetchJobById(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data?.data || data?.job || data;
}

export async function fetchSimilarJobs(id) {
  const { data } = await api.get(`/jobs/${id}/similar`);
  return data?.data || data || [];
}

export async function fetchStats() {
  const { data } = await api.get('/stats');
  return data?.data || data;
}
