/**
 * Copy firststep_ai collections from a source Mongo URI to Atlas.
 * Usage:
 *   SOURCE_MONGODB_URI=mongodb://127.0.0.1:27018/ node src/scripts/migrateToAtlas.js
 * Target comes from .env MONGODB_URI + MONGODB_DB_NAME.
 */
import dotenv from 'dotenv';
import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

const DB_NAME = process.env.MONGODB_DB_NAME || 'firststep_ai';
const TARGET_URI = process.env.MONGODB_URI;
const SOURCE_URI = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27018/';

if (!TARGET_URI || TARGET_URI.includes('127.0.0.1') || TARGET_URI.includes('localhost')) {
  console.error('MONGODB_URI must be Atlas (not local).');
  process.exit(1);
}

async function copyCollection(sourceDb, targetDb, name) {
  const docs = await sourceDb.collection(name).find({}).toArray();
  if (!docs.length) {
    console.log(`  ${name}: 0 docs (skip)`);
    return 0;
  }
  await targetDb.collection(name).deleteMany({});
  // Insert in chunks to avoid huge payloads
  const chunk = 500;
  for (let i = 0; i < docs.length; i += chunk) {
    await targetDb.collection(name).insertMany(docs.slice(i, i + chunk), { ordered: false });
  }
  console.log(`  ${name}: ${docs.length} docs`);
  return docs.length;
}

async function main() {
  console.log(`[migrate] source ${SOURCE_URI.replace(/\/\/.*@/, '//***@')} / ${DB_NAME}`);
  console.log(`[migrate] target ${TARGET_URI.replace(/\/\/.*@/, '//***@')} / ${DB_NAME}`);

  const source = await mongoose.createConnection(SOURCE_URI, { dbName: DB_NAME }).asPromise();
  const target = await mongoose.createConnection(TARGET_URI, { dbName: DB_NAME }).asPromise();

  const collections = await source.db.listCollections().toArray();
  const names = collections.map((c) => c.name).filter((n) => !n.startsWith('system.'));
  console.log(`[migrate] collections: ${names.join(', ') || '(none)'}`);

  let total = 0;
  for (const name of names) {
    total += await copyCollection(source.db, target.db, name);
  }

  console.log(`[migrate] done — ${total} documents across ${names.length} collections`);
  await source.close();
  await target.close();
}

main().catch(async (error) => {
  console.error('[migrate] failed', error);
  process.exit(1);
});
