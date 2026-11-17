import { describe, expect, it } from 'vitest';

function costPer1000(totalCost, successfulPosts) {
  if (!successfulPosts) return null;
  return Number(((totalCost / successfulPosts) * 1000).toFixed(6));
}

describe('cost calculation', () => {
  it('includes retry overhead when total cost already includes retries', () => {
    const totalCost = 0.05;
    const successful = 25;
    expect(costPer1000(totalCost, successful)).toBe(2);
  });

  it('returns null when no successful posts', () => {
    expect(costPer1000(1, 0)).toBeNull();
  });
});
