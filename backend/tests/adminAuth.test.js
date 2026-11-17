import { describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '../src/middleware/adminAuth.js';

describe('admin auth', () => {
  it('rejects missing key', () => {
    const req = { header: () => undefined };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
