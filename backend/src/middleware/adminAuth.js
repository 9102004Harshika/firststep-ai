import { env } from '../config/env.js';

const WEAK_ADMIN_KEYS = new Set([
  '',
  'change-me',
  'change-me-to-a-long-random-secret',
  'dev-admin-key-change-me',
  'admin',
  'password',
  'secret',
]);

export function requireAdmin(req, res, next) {
  if (env.nodeEnv === 'production' && WEAK_ADMIN_KEYS.has(String(env.adminApiKey || ''))) {
    return res.status(503).json({
      ok: false,
      error: 'Admin API disabled: set a strong ADMIN_API_KEY before enabling admin routes in production.',
    });
  }

  const key =
    req.header('x-admin-api-key') || req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (!key || key !== env.adminApiKey) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized. Provide a valid ADMIN_API_KEY via x-admin-api-key header.',
    });
  }
  return next();
}
