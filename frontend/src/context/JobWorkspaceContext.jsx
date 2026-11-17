import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { readJson, writeJson } from '../utils/storage.js';
import { getJobId, getCompanyName, getCity, getApplyUrl } from '../utils/jobHelpers.js';

const JobWorkspaceContext = createContext(null);

function snapshot(job) {
  const id = String(getJobId(job));
  return {
    id,
    title: job.title || 'Untitled role',
    company: getCompanyName(job),
    city: getCity(job),
    role: job.role || null,
    experienceLevel: job.experienceLevel || null,
    employmentType: job.employmentType || null,
    fresherEligible: job.fresherEligible ?? null,
    applyUrl: getApplyUrl(job),
    source: job.source || null,
    postedAt: job.postedAt || null,
    savedAt: new Date().toISOString(),
  };
}

export function JobWorkspaceProvider({ children }) {
  const [saved, setSaved] = useState(() => readJson('saved', {}));
  const [applications, setApplications] = useState(() => readJson('applications', {}));
  const [recent, setRecent] = useState(() => readJson('recent', []));
  const [notes, setNotes] = useState(() => readJson('notes', {}));

  useEffect(() => writeJson('saved', saved), [saved]);
  useEffect(() => writeJson('applications', applications), [applications]);
  useEffect(() => writeJson('recent', recent), [recent]);
  useEffect(() => writeJson('notes', notes), [notes]);

  const isSaved = useCallback((id) => Boolean(saved[String(id)]), [saved]);

  const toggleSave = useCallback((job) => {
    const id = String(getJobId(job));
    if (!id || id === 'null') return;
    setSaved((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = snapshot(job);
      return next;
    });
  }, []);

  const getApplication = useCallback(
    (id) => applications[String(id)] || null,
    [applications],
  );

  const setApplicationStatus = useCallback((job, status, extra = {}) => {
    const id = String(getJobId(job));
    if (!id || id === 'null') return;
    setApplications((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || snapshot(job)),
        ...snapshot(job),
        status,
        updatedAt: new Date().toISOString(),
        appliedAt: status === 'applied' ? new Date().toISOString() : prev[id]?.appliedAt,
        ...extra,
      },
    }));
  }, []);

  const clearApplication = useCallback((id) => {
    setApplications((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });
  }, []);

  const trackView = useCallback((job) => {
    const id = String(getJobId(job));
    if (!id || id === 'null') return;
    setRecent((prev) => {
      const item = { ...snapshot(job), viewedAt: new Date().toISOString() };
      return [item, ...prev.filter((r) => r.id !== id)].slice(0, 20);
    });
  }, []);

  const setJobNote = useCallback((id, text) => {
    setNotes((prev) => ({ ...prev, [String(id)]: text }));
  }, []);

  const savedList = useMemo(
    () => Object.values(saved).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || '')),
    [saved],
  );

  const applicationList = useMemo(
    () =>
      Object.values(applications).sort((a, b) =>
        (b.updatedAt || '').localeCompare(a.updatedAt || ''),
      ),
    [applications],
  );

  const value = useMemo(
    () => ({
      saved,
      savedList,
      applications,
      applicationList,
      recent,
      notes,
      isSaved,
      toggleSave,
      getApplication,
      setApplicationStatus,
      clearApplication,
      trackView,
      setJobNote,
    }),
    [
      saved,
      savedList,
      applications,
      applicationList,
      recent,
      notes,
      isSaved,
      toggleSave,
      getApplication,
      setApplicationStatus,
      clearApplication,
      trackView,
      setJobNote,
    ],
  );

  return (
    <JobWorkspaceContext.Provider value={value}>{children}</JobWorkspaceContext.Provider>
  );
}

export function useJobWorkspace() {
  const ctx = useContext(JobWorkspaceContext);
  if (!ctx) throw new Error('useJobWorkspace must be used within JobWorkspaceProvider');
  return ctx;
}
