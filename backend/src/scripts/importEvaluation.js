import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb, disconnectDb } from '../config/db.js';
import { importBenchmarkCsv } from '../services/evaluation/exportImport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await connectDb();
  const file = path.resolve(__dirname, '../../../../evaluation/benchmark.csv');
  const result = await importBenchmarkCsv(file);
  console.log(JSON.stringify(result, null, 2));
  await disconnectDb();
}

main().catch(async (error) => {
  console.error(error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
