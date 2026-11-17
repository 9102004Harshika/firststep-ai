import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../config/db.js';
import { exportBenchmarkCsv } from '../services/evaluation/exportImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDb();
  const out = path.resolve(__dirname, '../../../../evaluation/benchmark.csv');
  const result = await exportBenchmarkCsv(out, { limit: 50 });
  console.log(result);
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
