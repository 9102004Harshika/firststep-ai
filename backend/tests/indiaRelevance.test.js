import { describe, expect, it } from 'vitest';
import {
  evaluateIndiaGeography,
  shouldIngestJob,
  isEarlyCareerSignal,
  extractIndianCities,
} from '../src/utils/indiaRelevance.js';
import { normalizeJob } from '../src/services/ingestion/normalization/normalizeJob.js';

describe('India geography', () => {
  it('accepts explicit Indian cities', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'Bengaluru, India',
      title: 'Software Engineer',
    });
    expect(geo.indiaRelevant).toBe(true);
    expect(geo.cities).toContain('Bengaluru');
    expect(geo.geographicEvidence.type).toBe('city');
  });

  it('rejects SF internship — early-career alone is not India evidence', () => {
    const decision = shouldIngestJob({
      locationRaw: 'San Francisco, CA',
      title: 'Product Design Intern',
      countryRelevance: 'india-hiring',
    });
    expect(decision.keep).toBe(false);
    expect(isEarlyCareerSignal('Product Design Intern')).toBe(true);
  });

  it('does not treat Remote alone as India', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'Remote',
      title: 'Backend Engineer',
      description: 'Work from anywhere on our global team.',
    });
    expect(geo.indiaRelevant).toBe(false);
    expect(extractIndianCities('Remote')).toEqual([]);
  });

  it('accepts Remote India / India-based remote', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'Remote - India',
      title: 'SWE',
    });
    expect(geo.indiaRelevant).toBe(true);
  });

  it('rejects English "in" + remote false positive', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'Berlin, Germany',
      description: 'You will work in our hybrid office in Berlin.',
    });
    expect(geo.indiaRelevant).toBe(false);
  });

  it('rejects US Indiana state abbreviation ", IN"', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'Plainfield, IN',
      title: 'Auto Body Technician',
    });
    expect(geo.indiaRelevant).toBe(false);
  });

  it('still accepts explicit India country locations', () => {
    const geo = evaluateIndiaGeography({
      locationRaw: 'India - Pune',
      title: 'Analyst',
    });
    expect(geo.indiaRelevant).toBe(true);
  });

  it('normalizeJob marks overseas intern as not indiaRelevant', () => {
    const result = normalizeJob({
      externalId: 'sf-1',
      title: 'Software Engineer Intern',
      company: 'Stripe',
      descriptionHtml: '<p>Internship in San Francisco</p>',
      locationRaw: 'San Francisco, Seattle, New York City',
      jobUrl: 'https://stripe.com/jobs/sf-1',
      source: 'greenhouse',
      sourceBoard: 'stripe',
    });
    expect(result.ok).toBe(true);
    expect(result.job.indiaRelevant).toBe(false);
    expect(result.job.location.cities).toEqual([]);
  });

  it('normalizeJob keeps Bengaluru early-career', () => {
    const result = normalizeJob({
      externalId: 'blr-1',
      title: 'Software Engineer Intern',
      company: 'Stripe',
      descriptionHtml: '<p>Intern in Bengaluru</p>',
      locationRaw: 'Bengaluru',
      jobUrl: 'https://stripe.com/jobs/blr-1',
      source: 'greenhouse',
      sourceBoard: 'stripe',
    });
    expect(result.job.indiaRelevant).toBe(true);
    expect(result.job.geographicEvidence.type).toBe('city');
  });
});
