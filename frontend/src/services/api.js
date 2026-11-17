import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed';
    const enriched = new Error(message);
    enriched.status = error.response?.status;
    enriched.data = error.response?.data;
    enriched.original = error;
    return Promise.reject(enriched);
  },
);

export function getApiBaseLabel() {
  return API_BASE || '/api (proxied)';
}
