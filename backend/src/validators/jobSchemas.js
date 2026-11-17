import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  ROLE_TAXONOMY,
} from '../config/constants.js';

export const rawJobSchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  descriptionHtml: z.string().optional().default(''),
  locationRaw: z.string().optional().default(''),
  jobUrl: z.string().url(),
  source: z.string().min(1),
  sourceBoard: z.string().min(1),
  postedAt: z.string().nullable().optional(),
  employmentTypeHint: z.string().nullable().optional(),
  raw: z.any().optional(),
});

export const classificationOutputSchema = z.object({
  role: z.enum(ROLE_TAXONOMY),
  cities: z.array(z.string()).default([]),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  fresherEligible: z.boolean().nullable(),
  confidence: z.number().min(0).max(1),
  evidence: z.string().default(''),
});

export const jobsQuerySchema = z.object({
  search: z.string().optional().default(''),
  role: z.string().optional(),
  city: z.string().optional(),
  experienceLevel: z.string().optional(),
  employmentType: z.string().optional(),
  fresherEligible: z
    .enum(['true', 'false', 'null', 'yes', 'no'])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === 'true' || v === 'yes') return true;
      if (v === 'false' || v === 'no') return false;
      return null;
    }),
  indiaRelevant: z
    .enum(['true', 'false', 'yes', 'no'])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === 'true' || v === 'yes';
    }),
  earlyCareer: z
    .enum(['true', 'false', 'yes', 'no'])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === 'true' || v === 'yes';
    }),
  remote: z
    .enum(['true', 'false', 'yes', 'no'])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === 'true' || v === 'yes';
    }),
  status: z.enum(['active', 'inactive', 'expired']).optional().default('active'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z
    .enum([
      'postedAt',
      '-postedAt',
      'createdAt',
      '-createdAt',
      'newest',
      'oldest',
      'company',
      '-company',
    ])
    .optional()
    .default('-postedAt')
    .transform((v) => {
      if (v === 'newest') return '-postedAt';
      if (v === 'oldest') return 'postedAt';
      if (v === 'company') return 'company';
      return v;
    }),
});
