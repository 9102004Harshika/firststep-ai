import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  FIRSTSTEP_MONGO_DB_PATH,
  FIRSTSTEP_MONGO_PORT,
  ensureFirststepMongoDir,
} from '../config/localMongo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '../..');

async function main() {
  const scriptRel = process.argv[2];
  if (!scriptRel) {
    console.error('Usage: node src/scripts/withMemoryMongo.js src/scripts/runIngestion.js');
    process.exit(1);
  }

  ensureFirststepMongoDir();

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: FIRSTSTEP_MONGO_PORT,
      dbPath: FIRSTSTEP_MONGO_DB_PATH,
      storageEngine: 'wiredTiger',
    },
  });
  const uri = mongod.getUri();
  console.log(`[firststep-mongo] ${uri}`);
  console.log(`[firststep-mongo] persistent dbPath=${FIRSTSTEP_MONGO_DB_PATH}`);

  const scriptPath = path.resolve(backendRoot, scriptRel);
  const childArgs = [scriptPath, ...process.argv.slice(3)];
  const keepAlive = process.env.KEEP_MONGO_ALIVE === '1' || scriptRel.includes('server.js');

  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, childArgs, {
      cwd: backendRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        MONGODB_URI: uri,
        MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'firststep_ai',
      },
    });
    child.on('exit', (exitCode) => resolve(exitCode ?? 1));
  });

  if (!keepAlive) {
    await mongod.stop({ doCleanup: false, force: false });
  } else {
    // Server process exited; stop mongo.
    await mongod.stop({ doCleanup: false, force: false });
  }

  process.exit(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
