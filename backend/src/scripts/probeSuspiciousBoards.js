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
for (const company of [/aviation/i, /centria/i, /instawork/i, /freshprints/i]) {
  const docs = await Job.find({ status:'active', company, indiaRelevant:true }).select({title:1,'location.raw':1,company:1}).limit(5).lean();
  const n = await Job.countDocuments({ status:'active', company, indiaRelevant:true });
  console.log(String(company), 'india', n, docs.map(d=>({c:d.company,t:d.title,l:d.location?.raw})));
}
await disconnectDb();
