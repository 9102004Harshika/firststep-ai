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

const earlyOr = [
  { fresherEligible: true },
  { employmentType: 'Internship' },
  { experienceLevel: { $in: ['Internship', 'Fresher', 'Entry Level'] } },
  {
    title: {
      $regex:
        '\\b(intern|internship|fresher|graduate|campus|trainee|junior|new\\s*grad|entry[-\\s]?level|associate)\\b',
      $options: 'i',
    },
  },
];

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  await connectDb();
  const totalActive = await Job.countDocuments({ status: 'active' });
  const india = await Job.countDocuments({ status: 'active', indiaRelevant: true });
  const earlyIndia = await Job.countDocuments({
    status: 'active',
    indiaRelevant: true,
    $or: earlyOr,
  });
  const unknownRoleIndia = await Job.countDocuments({
    status: 'active',
    indiaRelevant: true,
    role: 'Unknown',
  });
  console.log(JSON.stringify({ totalActive, india, earlyIndia, unknownRoleIndia }, null, 2));
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
