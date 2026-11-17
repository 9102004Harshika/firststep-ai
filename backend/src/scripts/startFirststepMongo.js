/**
 * Starts a dedicated FirstStep AI MongoDB instance (port 27018 by default).
 * Completely separate from the inkstall Mongo on :27017.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_DB_PATH,
  FIRSTSTEP_MONGO_PORT,
  FIRSTSTEP_MONGO_URI,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

async function main() {
  ensureFirststepMongoDir();
  console.log(`[firststep-mongo] data dir: ${FIRSTSTEP_MONGO_DB_PATH}`);
  console.log(`[firststep-mongo] starting on ${FIRSTSTEP_MONGO_URI}`);

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: FIRSTSTEP_MONGO_PORT,
      dbPath: FIRSTSTEP_MONGO_DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });

  console.log(`[firststep-mongo] ready ${mongod.getUri()}`);
  console.log('[firststep-mongo] keep this process running; Ctrl+C to stop');

  const shutdown = async () => {
    console.log('[firststep-mongo] stopping…');
    await mongod.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('[firststep-mongo] failed', error);
  process.exit(1);
});
