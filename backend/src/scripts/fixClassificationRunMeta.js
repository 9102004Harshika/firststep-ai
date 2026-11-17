import dotenv from 'dotenv';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
try { dns.setServers(['8.8.8.8','1.1.1.1']); } catch {}
const { connectDb, disconnectDb } = await import('../config/db.js');
const { ClassificationRun } = await import('../models/ClassificationRun.js');
await connectDb();
// Fix historical mislabeled runs: provider openai cannot use gemini model id
const bad = await ClassificationRun.find({ provider: 'openai', model: { $regex: /gemini/i } });
for (const run of bad) {
  const note = `HISTORICAL_METADATA_BUG: stored model=${run.model} while provider=openai; corrected attribution for audit. Original model field preserved in error note.`;
  run.error = [run.error, note].filter(Boolean).join(' | ');
  run.model = 'gpt-4o-mini (corrected; was misrecorded as gemini-2.5-flash)';
  if (run.status === 'running') {
    run.status = 'failed';
    run.finishedAt = run.finishedAt || new Date();
  }
  await run.save();
}
const stuck = await ClassificationRun.updateMany(
  { status: 'running', startedAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } },
  { $set: { status: 'failed', finishedAt: new Date(), error: 'Stale running lock/run auto-closed during metadata audit' } },
);
console.log(JSON.stringify({ correctedRuns: bad.length, staleClosed: stuck.modifiedCount }, null, 2));
await disconnectDb();
