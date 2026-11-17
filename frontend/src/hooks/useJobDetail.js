import { useEffect, useState } from 'react';
import { fetchJobById } from '../services/jobsApi.js';

export function useJobDetail(id) {
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setError('Missing job id');
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setError(null);
      try {
        const data = await fetchJobById(id);
        if (!cancelled) {
          setJob(data);
          setStatus('ok');
        }
      } catch (err) {
        if (!cancelled) {
          setJob(null);
          setStatus('error');
          setError(err.message || 'Failed to load job');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return {
    job,
    status,
    error,
    loading: status === 'loading' || status === 'idle',
  };
}
