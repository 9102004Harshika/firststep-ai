import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchGreenhouseJobs } from '../src/services/ingestion/adapters/greenhouse.js';
import { fetchLeverJobs } from '../src/services/ingestion/adapters/lever.js';
import { fetchAshbyJobs } from '../src/services/ingestion/adapters/ashby.js';

describe('source adapters', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('greenhouse')) {
          return {
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
              jobs: [
                {
                  id: 99,
                  title: 'Software Engineer',
                  absolute_url: 'https://job-boards.greenhouse.io/stripe/jobs/99',
                  location: { name: 'Bengaluru, India' },
                  content: '<p>Build things</p>',
                  updated_at: '2024-01-01T00:00:00.000Z',
                },
              ],
            }),
          };
        }
        if (String(url).includes('lever')) {
          return {
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => [
              {
                id: 'abc',
                text: 'Intern',
                hostedUrl: 'https://jobs.lever.co/canva/abc',
                categories: { location: 'India', commitment: 'Internship' },
                description: 'Internship in India',
                createdAt: 1700000000000,
              },
            ],
          };
        }
        return {
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            jobs: [
              {
                id: 'ash-1',
                title: 'Software Engineering Intern',
                jobUrl: 'https://jobs.ashbyhq.com/linear/ash-1',
                location: 'Bengaluru, India',
                descriptionHtml: 'Help customers',
                publishedAt: '2024-02-01T00:00:00.000Z',
              },
            ],
          }),
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses greenhouse jobs', async () => {
    const jobs = await fetchGreenhouseJobs('postman', 'Postman', {
      countryRelevance: 'india-hiring',
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].source).toBe('greenhouse');
    expect(jobs[0].externalId).toBe('99');
  });

  it('rejects overseas greenhouse internships without India geography', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          jobs: [
            {
              id: 1,
              title: 'Product Design Intern',
              absolute_url: 'https://job-boards.greenhouse.io/stripe/jobs/1',
              location: { name: 'San Francisco, CA' },
              content: '<p>Internship in SF</p>',
              updated_at: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 2,
              title: 'Software Engineer Intern',
              absolute_url: 'https://job-boards.greenhouse.io/stripe/jobs/2',
              location: { name: 'Bengaluru, India' },
              content: '<p>Internship in Bengaluru</p>',
              updated_at: '2024-01-01T00:00:00.000Z',
            },
          ],
        }),
      })),
    );

    const jobs = await fetchGreenhouseJobs('stripe', 'Stripe', {
      countryRelevance: 'india-hiring',
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].externalId).toBe('2');
  });

  it('parses lever jobs', async () => {
    const jobs = await fetchLeverJobs('canva', 'Canva');
    expect(jobs[0].title).toBe('Intern');
    expect(jobs[0].source).toBe('lever');
  });

  it('parses ashby jobs', async () => {
    const jobs = await fetchAshbyJobs('linear', 'Linear');
    expect(jobs[0].source).toBe('ashby');
    expect(jobs[0].jobUrl).toContain('ashbyhq');
  });
});
