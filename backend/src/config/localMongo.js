import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

/** Dedicated FirstStep Mongo data dir — not shared with inkstall. */
export const FIRSTSTEP_MONGO_DB_PATH = path.join(projectRoot, '.data', 'firststep-mongo');

/** Fixed local port so .env can point at this instance without inkstall credentials. */
export const FIRSTSTEP_MONGO_PORT = Number(process.env.FIRSTSTEP_MONGO_PORT || 27018);

export const FIRSTSTEP_MONGO_URI = `mongodb://127.0.0.1:${FIRSTSTEP_MONGO_PORT}/`;

export function ensureFirststepMongoDir() {
  fs.mkdirSync(FIRSTSTEP_MONGO_DB_PATH, { recursive: true });
  return FIRSTSTEP_MONGO_DB_PATH;
}
