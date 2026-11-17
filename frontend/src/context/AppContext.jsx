import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchHealth } from '../services/analyticsApi.js';
import { fetchStats } from '../services/jobsApi.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [health, setHealth] = useState({ status: 'idle', data: null, error: null });
  const [stats, setStats] = useState({ status: 'idle', data: null, error: null });
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshHealth = useCallback(async () => {
    setHealth((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const data = await fetchHealth();
      setHealth({ status: data?.ok ? 'ok' : 'error', data, error: null });
      if (data?.timestamp) setLastUpdated(data.timestamp);
      return data;
    } catch (error) {
      setHealth({ status: 'error', data: null, error: error.message });
      throw error;
    }
  }, []);

  const refreshStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const data = await fetchStats();
      setStats({ status: 'ok', data, error: null });
      const stamp = data?.lastUpdated || data?.updatedAt || data?.timestamp;
      if (stamp) setLastUpdated(stamp);
      return data;
    } catch (error) {
      setStats({ status: 'error', data: null, error: error.message });
      throw error;
    }
  }, []);

  useEffect(() => {
    refreshHealth().catch(() => {});
    refreshStats().catch(() => {});
  }, [refreshHealth, refreshStats]);

  const value = useMemo(
    () => ({
      health,
      stats,
      lastUpdated,
      refreshHealth,
      refreshStats,
      setLastUpdated,
    }),
    [health, stats, lastUpdated, refreshHealth, refreshStats],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
