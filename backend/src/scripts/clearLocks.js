import { connectDb, disconnectDb } from '../config/db.js';
import { PipelineLock } from '../models/PipelineLock.js';

async function main() {
  await connectDb();
  const result = await PipelineLock.deleteMany({});
  console.log('Cleared locks:', result.deletedCount);
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
