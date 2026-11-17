import { env } from '../../../config/env.js';

export async function geminiComplete({ system, user, model }) {
  const apiKey = env.llm.geminiApiKey;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const selectedModel = model || env.llm.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.llm.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: env.llm.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    const usage = data?.usageMetadata || {};

    return {
      text,
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      model: selectedModel,
      provider: 'gemini',
      raw: data,
    };
  } finally {
    clearTimeout(timer);
  }
}
