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
const earlyIds = new Set((await Job.find({ status:'active', indiaRelevant:true, $or:earlyOr }).select({_id:1}).lean()).map(j=>String(j._id)));
const india = await Job.find({ status:'active', indiaRelevant:true }).select({ title:1, company:1, description:1, experienceLevel:1, employmentType:1 }).lean();
const descEarly = /\b(intern(?:ship)?|fresher|campus\s+hire|graduate\s+trainee|apprentice|new\s*grad|0\s*[-–to]+\s*1\s*years?|freshers?\s+welcome|open\s+to\s+freshers?|no\s+experience\s+required|entry[-\s]?level)\b/i;
let hit=0; const samples=[];
for (const j of india) {
  if (earlyIds.has(String(j._id))) continue;
  if (descEarly.test(j.description || '')) {
    hit++;
    if (samples.length < 20) samples.push({ title:j.title, company:j.company, exp:j.experienceLevel, snip:(j.description||'').slice(0,120).replace(/\s+/g,' ') });
  }
}
console.log(JSON.stringify({ india:india.length, earlyNow:earlyIds.size, descEarlyNotCounted:hit, samples }, null, 2));
await disconnectDb();
