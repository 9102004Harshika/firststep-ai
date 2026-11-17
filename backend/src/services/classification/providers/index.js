import { geminiComplete } from './gemini.js';
import { groqComplete } from './groq.js';
import { openaiComplete } from './openai.js';
import { mockComplete } from './mock.js';
import { env } from '../../../config/env.js';

const providers = {
  gemini: geminiComplete,
  groq: groqComplete,
  openai: openaiComplete,
  mock: mockComplete,
};

export async function completeChat({ system, user, provider, model }) {
  const selected = provider || env.llm.provider;
  const fn = providers[selected];
  if (!fn) throw new Error(`Unknown LLM provider: ${selected}`);

  try {
    return await fn({ system, user, model });
  } catch (error) {
    const fallback = env.llm.fallbackProvider;
    if (fallback && fallback !== selected && providers[fallback]) {
      console.warn(`[llm] ${selected} failed (${error.message}); trying fallback ${fallback}`);
      return providers[fallback]({
        system,
        user,
        model: env.llm.fallbackModel || undefined,
      });
    }
    throw error;
  }
}
