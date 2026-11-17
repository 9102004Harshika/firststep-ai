import { connectDb, disconnectDb } from '../config/db.js';
import { runClassification } from '../services/classification/runClassification.js';

async function main() {
  const limit = Number(process.env.CLASSIFY_LIMIT || 300);
  await connectDb();
  const result = await runClassification({ trigger: 'script', limit });
  console.log(JSON.stringify(result, null, 2));
  await disconnectDb();
  if (!result.ok && result.status !== 'locked') process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
