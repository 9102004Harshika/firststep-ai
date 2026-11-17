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
const carvana = await Job.find({ status:'active', company:/carvana/i, indiaRelevant:true })
  .select({ title:1, 'location.raw':1, 'location.cities':1, geographicEvidence:1, experienceLevel:1, employmentType:1 })
  .limit(25).lean();
console.log('carvana india', await Job.countDocuments({status:'active', company:/carvana/i, indiaRelevant:true}));
console.log(carvana.map(j=>({title:j.title, loc:j.location?.raw, cities:j.location?.cities, evidence:j.geographicEvidence, exp:j.experienceLevel})));
const capco = await Job.find({ status:'active', company:/capco/i, indiaRelevant:true })
  .select({ title:1, 'location.raw':1, 'location.cities':1, geographicEvidence:1 }).limit(15).lean();
console.log('capco india', await Job.countDocuments({status:'active', company:/capco/i, indiaRelevant:true}));
console.log(capco.map(j=>({title:j.title, loc:j.location?.raw, cities:j.location?.cities, evidence:j.geographicEvidence})));
await disconnectDb();
