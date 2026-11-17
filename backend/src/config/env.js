import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Windows / ISP DNS often breaks mongodb+srv SRV lookups — prefer public resolvers.
if (process.env.MONGODB_URI?.includes('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    dns.setDefaultResultOrder('ipv4first');
  } catch {
    // ignore
  }
}

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(5050),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default('firststep_ai'),
  ADMIN_API_KEY: z.string().default('dev-admin-key-change-me'),
  CORS_ORIGIN: z.string().default('*'),
  LLM_PROVIDER: z.enum(['gemini', 'groq', 'openai', 'mock']).default('gemini'),
  LLM_MODEL: z.string().default('gemini-2.5-flash'),
  LLM_FALLBACK_PROVIDER: z.string().optional().default(''),
  LLM_FALLBACK_ORDER: z.string().optional().default(''),
  LLM_FALLBACK_MODEL: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GROQ_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().optional().default('gpt-4o-mini'),
  LLM_TIMEOUT_MS: z.coerce.number().default(60000),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().default(1024),
  LLM_CONCURRENCY: z.coerce.number().default(3),
  LLM_PROMPT_VERSION: z.string().default('v2'),
  LLM_INPUT_PRICE_PER_MTOK: z.coerce.number().default(0.1),
  LLM_OUTPUT_PRICE_PER_MTOK: z.coerce.number().default(0.4),
  INGESTION_REQUEST_TIMEOUT_MS: z.coerce.number().default(20000),
  INGESTION_MAX_RETRIES: z.coerce.number().default(3),
  INGESTION_LOCK_TTL_MS: z.coerce.number().default(30 * 60 * 1000),
  JOB_STALE_DAYS: z.coerce.number().default(45),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed.data;
}

const data = loadEnv();

export const env = {
  nodeEnv: data.NODE_ENV,
  port: data.PORT,
  get mongodbUri() {
    return process.env.MONGODB_URI || data.MONGODB_URI;
  },
  get mongodbDbName() {
    return process.env.MONGODB_DB_NAME || data.MONGODB_DB_NAME;
  },
  adminApiKey: data.ADMIN_API_KEY,
  corsOrigin: data.CORS_ORIGIN,
  llm: {
    provider: data.LLM_PROVIDER,
    model: data.LLM_MODEL,
    fallbackProvider:
      data.LLM_FALLBACK_PROVIDER ||
      String(data.LLM_FALLBACK_ORDER || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      null,
    fallbackModel: data.LLM_FALLBACK_MODEL || data.OPENAI_MODEL || null,
    geminiApiKey: data.GEMINI_API_KEY,
    groqApiKey: data.GROQ_API_KEY,
    openaiApiKey: data.OPENAI_API_KEY,
    openaiModel: data.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs: data.LLM_TIMEOUT_MS,
    maxOutputTokens: data.LLM_MAX_OUTPUT_TOKENS,
    concurrency: data.LLM_CONCURRENCY,
    promptVersion: data.LLM_PROMPT_VERSION,
    pricing: {
      inputPerMTok: data.LLM_INPUT_PRICE_PER_MTOK,
      outputPerMTok: data.LLM_OUTPUT_PRICE_PER_MTOK,
    },
  },
  ingestion: {
    timeoutMs: data.INGESTION_REQUEST_TIMEOUT_MS,
    maxRetries: data.INGESTION_MAX_RETRIES,
    lockTtlMs: data.INGESTION_LOCK_TTL_MS,
    staleDays: data.JOB_STALE_DAYS,
  },
};

export function assertLlmConfigured(provider = env.llm.provider) {
  if (provider === 'mock') return;
  if (provider === 'gemini' && !env.llm.geminiApiKey && !env.llm.fallbackProvider) {
    throw new Error('GEMINI_API_KEY is required for Gemini classification');
  }
  if (provider === 'groq' && !env.llm.groqApiKey) {
    throw new Error('GROQ_API_KEY is required for Groq classification');
  }
  if (provider === 'openai' && !env.llm.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for OpenAI classification');
  }
}
