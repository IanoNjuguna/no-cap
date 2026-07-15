import { describe, it, expect } from 'vitest';
import { calculatePercentages, totalShares, checkHealth } from './calcOwnership';
import { initialStakeholders } from '../data';

describe('calcOwnership', () => {
  it('total shares fully diluted = 10,000,000', () => {
    expect(totalShares(initialStakeholders, 'fullyDiluted')).toBe(10_000_000);
  });

  it('total shares active (excludes pool) = 9,000,000', () => {
    expect(totalShares(initialStakeholders, 'active')).toBe(9_000_000);
  });

  it('ownership % fully diluted matches spec', () => {
    const pct = calculatePercentages(initialStakeholders, 'fullyDiluted');
    const byName = Object.fromEntries(pct.map((s) => [s.name, s.ownershipPct]));
    expect(byName['Alice']).toBeCloseTo(40.0, 5);
    expect(byName['Bob']).toBeCloseTo(40.0, 5);
    expect(byName['Unallocated Option Pool']).toBeCloseTo(10.0, 5);
    expect(byName['Charlie']).toBeCloseTo(2.0, 5);
    expect(byName['Venture Capitalist A']).toBeCloseTo(8.0, 5);
  });

  it('ownership sums to 100% fully diluted', () => {
    const pct = calculatePercentages(initialStakeholders, 'fullyDiluted');
    const sum = pct.reduce((a, s) => a + s.ownershipPct, 0);
    expect(sum).toBeCloseTo(100, 5);
  });

  it('active mode excludes unallocated pool from total', () => {
    const pct = calculatePercentages(initialStakeholders, 'active');
    const byName = Object.fromEntries(pct.map((s) => [s.name, s.ownershipPct]));
    // pool gets 0 effective shares but still 0%
    expect(byName['Unallocated Option Pool']).toBe(0);
    // others rescale to /9,000,000
    expect(byName['Alice']).toBeCloseTo((4_000_000 / 9_000_000) * 100, 5);
    expect(byName['Venture Capitalist A']).toBeCloseTo((800_000 / 9_000_000) * 100, 5);
  });

  it('health check is healthy for valid mock data', () => {
    const h = checkHealth(initialStakeholders, 'fullyDiluted');
    expect(h.healthy).toBe(true);
    expect(h.messages).toHaveLength(0);
  });

  it('health check flags negative shares', () => {
    const bad = [{ ...initialStakeholders[0], shares: -100 }];
    const h = checkHealth(bad, 'fullyDiluted');
    expect(h.healthy).toBe(false);
    expect(h.messages.some((m) => m.includes('Negative'))).toBe(true);
  });

  it('health check flags empty name', () => {
    const bad = [{ ...initialStakeholders[0], name: '   ' }];
    const h = checkHealth(bad, 'fullyDiluted');
    expect(h.healthy).toBe(false);
    expect(h.messages.some((m) => m.includes('empty name'))).toBe(true);
  });

  it('handles empty stakeholder list', () => {
    expect(totalShares([], 'fullyDiluted')).toBe(0);
    expect(calculatePercentages([], 'fullyDiluted')).toHaveLength(0);
    const h = checkHealth([], 'fullyDiluted');
    expect(h.healthy).toBe(true);
  });
});
