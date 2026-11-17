import { describe, expect, it } from 'vitest';
import { normalizeJob } from '../src/services/ingestion/normalization/normalizeJob.js';
import { canonicalizeUrl } from '../src/utils/url.js';
import { fingerprintFrom } from '../src/utils/text.js';

describe('normalization', () => {
  it('canonicalizes URLs and strips tracking params', () => {
    const url = canonicalizeUrl(
      'https://boards.greenhouse.io/postman/jobs/123/?utm_source=x&gh_src=abc#section',
    );
    expect(url).toBe('https://boards.greenhouse.io/postman/jobs/123');
  });

  it('normalizes a valid greenhouse-like job', () => {
    const result = normalizeJob({
      externalId: '1',
      title: '  Graduate Software Engineer  ',
      company: 'Postman Inc.',
      descriptionHtml: '<p>Build APIs in Bengaluru, India</p>',
      locationRaw: 'Bengaluru, India',
      jobUrl: 'https://boards.greenhouse.io/postman/jobs/1',
      source: 'greenhouse',
      sourceBoard: 'postman',
      postedAt: '2024-01-01T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.job.company).toContain('Postman');
    expect(result.job.location.cities).toContain('Bengaluru');
    expect(result.job.indiaRelevant).toBe(true);
    expect(result.job.fingerprint).toBe(
      fingerprintFrom({
        company: result.job.company,
        title: result.job.title,
        locationRaw: result.job.location.raw,
      }),
    );
  });

  it('rejects invalid URLs', () => {
    const result = normalizeJob({
      externalId: '1',
      title: 'Engineer',
      company: 'X',
      jobUrl: 'not-a-url',
      source: 'greenhouse',
      sourceBoard: 'x',
    });
    expect(result.ok).toBe(false);
  });
});
