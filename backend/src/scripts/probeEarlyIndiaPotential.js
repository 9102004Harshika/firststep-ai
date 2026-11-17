/**
 * Estimate how many active India jobs match expanded early-career title patterns.
 * Read-only.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const STRICT =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate\s+(?:trainee|engineer|programme|program|hire)|entry[-\s]?level|junior|0\s*[-–]\s*1\s*years?|management\s+trainee|analyst\s+trainee|get\b|graduate\s+engineer\s+trainee)\b/i;

const PRODUCT =
  /\b(intern(?:ship)?|fresher|campus|trainee|apprentice|new\s*grad(?:uate)?|graduate|entry[-\s]?level|junior|associate)\b/i;

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  await connectDb();

  const india = await Job.find({ status: 'active', indiaRelevant: true })
    .select({ title: 1, experienceLevel: 1, employmentType: 1, fresherEligible: 1, company: 1 })
    .lean();

  let strict = 0;
  let product = 0;
  let fieldBased = 0;
  const companies = new Map();

  for (const j of india) {
    const title = j.title || '';
    const byField =
      j.fresherEligible === true ||
      j.employmentType === 'Internship' ||
      ['Internship', 'Fresher', 'Entry Level'].includes(j.experienceLevel);
    if (byField) fieldBased += 1;
    if (byField || STRICT.test(title)) {
      strict += 1;
      companies.set(j.company, (companies.get(j.company) || 0) + 1);
    }
    if (byField || PRODUCT.test(title)) product += 1;
  }

  const top = [...companies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  console.log(
    JSON.stringify(
      {
        indiaTotal: india.length,
        fieldBased,
        strictTitleOrField: strict,
        productTitleOrField: product,
        topCompaniesStrict: top,
      },
      null,
      2,
    ),
  );
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
