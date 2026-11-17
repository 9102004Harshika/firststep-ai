import { useCallback, useEffect, useState } from 'react';
import {
  fetchClassificationAnalytics,
  fetchCostAnalytics,
  fetchHealth,
  fetchIngestionAnalytics,
  fetchIngestionRuns,
  fetchLlmUsage,
  fetchPipelineHealth,
  fetchEvaluationSummary,
} from '../services/analyticsApi.js';

async function settle(promise) {
  try {
    const data = await promise;
    return { status: 'ok', data, error: null };
  } catch (error) {
    return { status: 'error', data: null, error: error.message || 'Request failed' };
  }
}

export function useAnalytics() {
  const [ingestion, setIngestion] = useState({ status: 'idle', data: null, error: null });
  const [classification, setClassification] = useState({
    status: 'idle',
    data: null,
    error: null,
  });
  const [cost, setCost] = useState({ status: 'idle', data: null, error: null });
  const [llm, setLlm] = useState({ status: 'idle', data: null, error: null });
  const [runs, setRuns] = useState({ status: 'idle', data: null, error: null });
  const [health, setHealth] = useState({ status: 'idle', data: null, error: null });
  const [pipeline, setPipeline] = useState({ status: 'idle', data: null, error: null });
  const [evaluation, setEvaluation] = useState({ status: 'idle', data: null, error: null });

  const reload = useCallback(async () => {
    setIngestion((p) => ({ ...p, status: 'loading' }));
    setClassification((p) => ({ ...p, status: 'loading' }));
    setCost((p) => ({ ...p, status: 'loading' }));
    setLlm((p) => ({ ...p, status: 'loading' }));
    setRuns((p) => ({ ...p, status: 'loading' }));
    setHealth((p) => ({ ...p, status: 'loading' }));
    setPipeline((p) => ({ ...p, status: 'loading' }));
    setEvaluation((p) => ({ ...p, status: 'loading' }));

    const [ing, cls, cst, llmUsage, rn, hl, pipe, ev] = await Promise.all([
      settle(fetchIngestionAnalytics()),
      settle(fetchClassificationAnalytics()),
      settle(fetchCostAnalytics()),
      settle(fetchLlmUsage()),
      settle(fetchIngestionRuns()),
      settle(fetchHealth()),
      settle(fetchPipelineHealth()),
      settle(fetchEvaluationSummary()),
    ]);

    setIngestion(ing);
    setClassification(cls);
    setCost(cst);
    setLlm(llmUsage);
    setRuns(rn);
    setHealth(hl);
    setPipeline(pipe);
    setEvaluation(ev);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const slices = [ingestion, classification, cost, llm, runs, health, pipeline, evaluation];
  const loading =
    slices.some((s) => s.status === 'loading') || slices.every((s) => s.status === 'idle');

  return {
    ingestion,
    classification,
    cost,
    llm,
    runs,
    health,
    pipeline,
    evaluation,
    loading,
    reload,
  };
}
