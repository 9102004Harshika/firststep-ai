/**
 * Verify all enabled registry boards against live public endpoints.
 * Writes docs/SOURCE_VERIFICATION.json + prints summary.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { getEnabledSources } from '../services/ingestion/sourceRegistry.js';
import { fetchJobsForSource } from '../services/ingestion/adapters/index.js';
import { evaluateIndiaGeography, isEarlyCareerSignal } from '../utils/indiaRelevance.js';
import { mapWithConcurrency } from '../utils/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

async function verifyOne(source) {
  const started = Date.now();
  try {
    const jobs = await fetchJobsForSource(source);
    let india = 0;
    let early = 0;
    for (const job of jobs) {
      const geo = evaluateIndiaGeography({
        locationRaw: job.locationRaw,
        title: job.title,
        description: job.descriptionHtml || '',
      });
      if (geo.indiaRelevant) india += 1;
      if (isEarlyCareerSignal(`${job.title} ${job.locationRaw}`)) early += 1;
    }
    return {
      employer: source.employer,
      provider: source.provider,
      boardId: source.boardId,
      countryRelevance: source.countryRelevance,
      ok: true,
      httpStatus: 200,
      fetched: jobs.length,
      indiaRelevant: india,
      earlyCareer: early,
      durationMs: Date.now() - started,
      error: null,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      employer: source.employer,
      provider: source.provider,
      boardId: source.boardId,
      countryRelevance: source.countryRelevance,
      ok: false,
      httpStatus: error.status || null,
      fetched: 0,
      indiaRelevant: 0,
      earlyCareer: 0,
      durationMs: Date.now() - started,
      error: error.message || String(error),
      verifiedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  const sources = getEnabledSources();
  console.log(`[verify] checking ${sources.length} enabled sources…`);
  const results = await mapWithConcurrency(sources, 4, verifyOne);
  const summary = {
    verifiedAt: new Date().toISOString(),
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    totalFetched: results.reduce((s, r) => s + r.fetched, 0),
    totalIndiaRelevant: results.reduce((s, r) => s + r.indiaRelevant, 0),
    totalEarlyCareer: results.reduce((s, r) => s + r.earlyCareer, 0),
    sources: results.sort((a, b) => a.employer.localeCompare(b.employer)),
  };

  const outJson = path.resolve(__dirname, '../../../docs/SOURCE_VERIFICATION.json');
  const outMd = path.resolve(__dirname, '../../../docs/SOURCE_VERIFICATION.md');
  await fs.writeFile(outJson, JSON.stringify(summary, null, 2), 'utf8');

  const lines = [
    '# Source verification report',
    '',
    `Verified at: **${summary.verifiedAt}**`,
    '',
    `| Metric | Value |`,
    `| --- | ---: |`,
    `| Enabled sources | ${summary.total} |`,
    `| Healthy | ${summary.ok} |`,
    `| Failed | ${summary.failed} |`,
    `| Jobs returned (post geo filter) | ${summary.totalFetched} |`,
    `| India-relevant (recomputed) | ${summary.totalIndiaRelevant} |`,
    `| Early-career title signals | ${summary.totalEarlyCareer} |`,
    '',
    '| Employer | Provider | Board | OK | Fetched | India | Early | ms | Error |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
    ...summary.sources.map(
      (r) =>
        `| ${r.employer} | ${r.provider} | \`${r.boardId}\` | ${r.ok ? 'yes' : 'no'} | ${r.fetched} | ${r.indiaRelevant} | ${r.earlyCareer} | ${r.durationMs} | ${r.error || ''} |`,
    ),
    '',
  ];
  await fs.writeFile(outMd, lines.join('\n'), 'utf8');
  console.log(JSON.stringify({ ...summary, sources: undefined }, null, 2));
  console.log(`[verify] wrote ${outMd}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
