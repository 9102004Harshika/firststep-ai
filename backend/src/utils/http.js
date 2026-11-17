import { env } from '../config/env.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    timeoutMs = env.ingestion.timeoutMs,
    maxRetries = env.ingestion.maxRetries,
    retryOn = [408, 429, 500, 502, 503, 504],
  } = config;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FirstStepAI/1.0 (+https://github.com/firststep-ai)',
          ...(options.headers || {}),
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const error = new Error(`HTTP ${response.status} for ${url}: ${body.slice(0, 200)}`);
        error.status = response.status;
        if (!retryOn.includes(response.status) || attempt === maxRetries) {
          throw error;
        }
        lastError = error;
      } else {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return response.json();
        }
        return response.text();
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
    } finally {
      clearTimeout(timer);
    }

    const backoff = Math.min(8000, 400 * 2 ** attempt) + Math.floor(Math.random() * 200);
    await sleep(backoff);
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

export async function mapWithConcurrency(items, concurrency, iterator) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await iterator(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}
