import { connectDb, disconnectDb } from '../config/db.js';
import { runIngestion } from '../services/ingestion/runIngestion.js';

async function main() {
  await connectDb();
  const result = await runIngestion({ trigger: 'script' });
  console.log(JSON.stringify(result, null, 2));
  await disconnectDb();
  if (!result.ok && result.status !== 'locked') process.exit(1);
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
