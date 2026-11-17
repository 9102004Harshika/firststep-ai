import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try { dns.setServers(['8.8.8.8','1.1.1.1']); } catch {}
const { connectDb, disconnectDb } = await import('../config/db.js');
const { ClassificationRun } = await import('../models/ClassificationRun.js');
const { Job } = await import('../models/Job.js');
await connectDb();
const runs = await ClassificationRun.find().sort({ startedAt: -1 }).limit(10).lean();
console.log('runs', runs.map(r => ({
  id: String(r._id),
  provider: r.provider,
  model: r.model,
  prompt: r.promptVersion,
  status: r.status,
  totals: r.totals,
  startedAt: r.startedAt,
})));
const mismatch = await Job.countDocuments({
  status: 'active',
  'classification.status': 'classified',
  'classification.provider': 'openai',
  'classification.model': { $regex: /gemini/i },
});
const byMeta = await Job.aggregate([
  { $match: { status: 'active', 'classification.status': 'classified' } },
  { $group: { _id: { p: '$classification.provider', m: '$classification.model', v: '$classification.promptVersion' }, n: { $sum: 1 } } },
  { $sort: { n: -1 } },
]);
console.log(JSON.stringify({ openaiGeminiMismatch: mismatch, byMeta }, null, 2));
await disconnectDb();
