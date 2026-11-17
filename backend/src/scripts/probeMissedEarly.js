import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try { dns.setServers(['8.8.8.8','1.1.1.1']); } catch {}
const { connectDb, disconnectDb } = await import('../config/db.js');
const { Job } = await import('../models/Job.js');
await connectDb();
const earlyOr = [
  { fresherEligible: true },
  { employmentType: 'Internship' },
  { experienceLevel: { $in: ['Internship', 'Fresher', 'Entry Level'] } },
  { title: { $regex: '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b', $options: 'i' } },
];
const india = await Job.find({ status: 'active', indiaRelevant: true }).select({ title:1, company:1, experienceLevel:1, employmentType:1, fresherEligible:1 }).lean();
const early = new Set();
const earlyDocs = await Job.find({ status: 'active', indiaRelevant: true, $or: earlyOr }).select({ _id:1 }).lean();
for (const d of earlyDocs) early.add(String(d._id));
const patterns = {
  sde1: /\b(sde[-\s]?1|software\s+engineer\s+[i1]\b|engineer\s+i\b|swe\s+[i1]\b)/i,
  get: /\b(graduate\s+engineer|get\b|management\s+trainee|analyst\s+trainee)/i,
  zeroOne: /\b(0\s*[-–to]+\s*1\s*years?|0\s*[-–]\s*2\s*years?|1\s*years?\s+exp)/i,
  campusBatch: /\b(202[5-7]\s*(batch|passout|graduat)|off[-\s]?campus|campus\s+hir)/i,
  juniorish: /\b(jr\.?|junior|entry|fresher|intern|trainee|apprentice)/i,
};
const buckets = Object.fromEntries(Object.keys(patterns).map(k => [k, []]));
let notEarlyButPattern = 0;
for (const j of india) {
  const id = String(j._id);
  const isEarly = early.has(id);
  for (const [k, re] of Object.entries(patterns)) {
    if (re.test(j.title || '')) {
      if (!isEarly) {
        buckets[k].push({ title: j.title, company: j.company, exp: j.experienceLevel });
        notEarlyButPattern++;
      }
    }
  }
}
const summary = {};
for (const [k, arr] of Object.entries(buckets)) {
  summary[k] = { countNotInEarly: arr.length, samples: arr.slice(0, 8) };
}
console.log(JSON.stringify({ india: india.length, earlyNow: early.size, summary }, null, 2));
await disconnectDb();
