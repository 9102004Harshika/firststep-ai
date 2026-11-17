import { env } from '../../../config/env.js';

export async function groqComplete({ system, user, model }) {
  const apiKey = env.llm.groqApiKey;
  if (!apiKey) throw new Error('GROQ_API_KEY missing');

  const selectedModel = model || env.llm.model || 'llama-3.1-8b-instant';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.llm.timeoutMs);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature: 0.1,
        max_tokens: env.llm.maxOutputTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Groq HTTP ${response.status}`);
    }

    return {
      text: data?.choices?.[0]?.message?.content || '',
      inputTokens: data?.usage?.prompt_tokens || 0,
      outputTokens: data?.usage?.completion_tokens || 0,
      model: selectedModel,
      provider: 'groq',
      raw: data,
    };
  } finally {
    clearTimeout(timer);
  }
}
