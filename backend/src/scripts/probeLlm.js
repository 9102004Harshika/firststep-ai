import { env } from '../config/env.js';
import { geminiComplete } from '../services/classification/providers/gemini.js';
import { classifyJobRecord } from '../services/classification/classifyJob.js';

async function main() {
  console.log({
    provider: env.llm.provider,
    model: env.llm.model,
    keyLen: env.llm.geminiApiKey.length,
  });

  try {
    const r = await geminiComplete({
      system: 'Return valid JSON only.',
      user: 'Return {"ok":true,"role":"Software Development","cities":["Bengaluru"],"experienceLevel":"Fresher","employmentType":"Full-time","fresherEligible":true,"confidence":0.9,"evidence":"probe"}',
    });
    console.log('geminiComplete', {
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      text: r.text.slice(0, 300),
    });
  } catch (error) {
    console.error('geminiComplete failed:', error.message);
  }

  const sample = {
    title: 'Graduate Software Engineer',
    company: 'Example',
    location: { raw: 'Bengaluru, India' },
    description: 'Looking for graduates with JavaScript and React. Freshers welcome.',
  };
  const classified = await classifyJobRecord(sample, { force: true });
  console.log(JSON.stringify(classified, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
