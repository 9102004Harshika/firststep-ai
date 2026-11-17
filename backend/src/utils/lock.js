import crypto from 'node:crypto';
import { PipelineLock } from '../models/PipelineLock.js';
import { env } from '../config/env.js';

export async function acquireLock(name, owner = 'system') {
  const now = new Date();
  const token = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + env.ingestion.lockTtlMs);

  // Clear expired locks
  await PipelineLock.deleteMany({ name, expiresAt: { $lte: now } });

  try {
    await PipelineLock.create({ name, token, owner, expiresAt });
    return { acquired: true, token };
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await PipelineLock.findOne({ name }).lean();
      return {
        acquired: false,
        token: null,
        reason: 'Lock already held',
        existing,
      };
    }
    throw error;
  }
}

export async function releaseLock(name, token) {
  await PipelineLock.deleteOne({ name, token });
}
