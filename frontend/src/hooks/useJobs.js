import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchJobs } from '../services/jobsApi.js';
import { useApp } from '../context/AppContext.jsx';
import { useDebouncedValue } from './useDebouncedValue.js';

const DEFAULT_FILTERS = {
  search: '',
  role: '',
  city: '',
  experienceLevel: '',
  employmentType: '',
  fresherEligible: '',
  earlyCareer: true,
  // Product default: only show India-relevant opportunities.
  indiaRelevant: true,
  remote: '',
  page: 1,
  limit: 12,
  sort: 'newest',
};

export function useJobs(initial = {}) {
  const { setLastUpdated } = useApp();
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initial });
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        ...filters,
        search: debouncedSearch,
      }),
    [filters, debouncedSearch],
  );

  const load = useCallback(async () => {
    const query = JSON.parse(queryKey);
    setStatus('loading');
    setError(null);
    try {
      const result = await fetchJobs(query);
      setJobs(result.jobs);
      setPagination(result.pagination);
      if (result.meta?.lastUpdated) setLastUpdated(result.meta.lastUpdated);
      setStatus('ok');
      return result;
    } catch (err) {
      setJobs([]);
      setStatus('error');
      setError(err.message || 'Failed to load jobs');
      throw err;
    }
  }, [queryKey, setLastUpdated]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateFilters = useCallback((patch, { resetPage = true } = {}) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      ...(resetPage && patch.page == null ? { page: 1 } : {}),
    }));
  }, []);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.role ||
        filters.city ||
        filters.experienceLevel ||
        filters.employmentType ||
        filters.fresherEligible !== '' ||
        filters.earlyCareer !== true ||
        filters.indiaRelevant === true ||
        filters.remote === 'true' ||
        filters.remote === true,
    );
  }, [filters]);

  return {
    filters,
    jobs,
    pagination,
    status,
    error,
    loading: status === 'loading' || status === 'idle',
    hasActiveFilters,
    updateFilters,
    setPage,
    resetFilters,
    reload: load,
  };
}
