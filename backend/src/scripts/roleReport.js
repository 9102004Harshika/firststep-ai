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

async function main() {
  const { connectDb, disconnectDb } = await import('../config/db.js');
  const { Job } = await import('../models/Job.js');
  await connectDb();
  const roles = await Job.aggregate([
    {
      $match: {
        status: 'active',
        indiaRelevant: true,
        'classification.status': 'classified',
        'classification.promptVersion': 'v2',
      },
    },
    { $group: { _id: '$role', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  const unknown = roles.find((r) => r._id === 'Unknown')?.n || 0;
  const total = roles.reduce((s, r) => s + r.n, 0);
  console.log(
    JSON.stringify(
      { totalV2ClassifiedIndia: total, unknownRate: total ? unknown / total : null, roles },
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
