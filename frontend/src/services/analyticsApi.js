import { api } from './api.js';

export async function fetchIngestionAnalytics() {
  const { data } = await api.get('/analytics/ingestion');
  return data?.data || data;
}

export async function fetchClassificationAnalytics() {
  const { data } = await api.get('/analytics/classification');
  return data?.data || data;
}

export async function fetchCostAnalytics() {
  const { data } = await api.get('/analytics/cost');
  return data?.data || data;
}

export async function fetchLlmUsage() {
  const { data } = await api.get('/analytics/llm');
  return data?.data || data;
}

export async function fetchIngestionRuns(params = {}) {
  const { data } = await api.get('/ingestion/runs', { params });
  return data?.data || data?.runs || data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function fetchPipelineHealth() {
  const { data } = await api.get('/analytics/pipeline');
  return data?.data || data;
}

export async function fetchEvaluationSummary() {
  const { data } = await api.get('/evaluation/summary');
  return data?.data || data;
}
