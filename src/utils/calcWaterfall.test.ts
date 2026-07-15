import { describe, it, expect } from 'vitest';
import { calcWaterfall, prefEntitlement } from './calcWaterfall';
import { initialStakeholders } from '../data';

describe('calcWaterfall — mock data at $15M', () => {
  const result = calcWaterfall(initialStakeholders, 15_000_000, 'fullyDiluted');
  const seg = (name: string) =>
    result.segments.find((s) => s.name === name)!;

  it('VC preference entitlement = 1 × $1 × 800,000 = $800,000', () => {
    const vc = initialStakeholders.find((s) => s.name === 'Venture Capitalist A')!;
    expect(prefEntitlement(vc)).toBe(800_000);
  });

  it('total pref paid = $800,000', () => {
    expect(result.totalPrefPaid).toBe(800_000);
  });

  it('remaining after prefs = $14,200,000', () => {
    expect(result.remainingAfterPrefs).toBe(14_200_000);
  });

  it('VC participating pro-rata = 8% × $14,200,000 = $1,136,000', () => {
    expect(seg('Venture Capitalist A').proRataAmount).toBe(1_136_000);
  });

  it('VC total = pref $800,000 + participation $1,136,000 = $1,936,000', () => {
    expect(seg('Venture Capitalist A').total).toBe(1_936_000);
  });

  it('remaining after participation = $13,064,000', () => {
    expect(result.remainingAfterParticipation).toBe(13_064_000);
  });

  // Exact pro-rata: (shares / 9.2M) × $13,064,000.
  it('Alice pro-rata = (4M / 9.2M) × $13,064,000 = $5,680,000', () => {
    expect(seg('Alice').proRataAmount).toBe((4_000_000 / 9_200_000) * 13_064_000);
  });

  it('Bob pro-rata = same as Alice = $5,680,000', () => {
    expect(seg('Bob').proRataAmount).toBe((4_000_000 / 9_200_000) * 13_064_000);
  });

  it('Unallocated Pool pro-rata = (1M / 9.2M) × $13,064,000 = $1,420,000', () => {
    expect(seg('Unallocated Option Pool').proRataAmount).toBe(
      (1_000_000 / 9_200_000) * 13_064_000
    );
  });

  it('Charlie pro-rata = (200k / 9.2M) × $13,064,000 = $284,000', () => {
    expect(seg('Charlie').proRataAmount).toBe((200_000 / 9_200_000) * 13_064_000);
  });

  it('all segments sum to exit value $15,000,000 (within cents)', () => {
    const sum = result.segments.reduce((a, s) => a + s.total, 0);
    expect(Math.abs(sum - 15_000_000)).toBeLessThanOrEqual(0.02);
  });

  it('VC segment pct of exit ≈ 12.91%', () => {
    expect(seg('Venture Capitalist A').pctOfExit).toBeCloseTo(
      (1_936_000 / 15_000_000) * 100,
      2
    );
  });
});

describe('calcWaterfall — edge cases', () => {
  it('exitValue < sum(preferences): prefs share shortfall pro-rata by entitlement', () => {
    // VC entitlement = $800,000, exit = $500,000 -> VC gets entire $500,000
    const result = calcWaterfall(initialStakeholders, 500_000, 'fullyDiluted');
    const vc = result.segments.find((s) => s.name === 'Venture Capitalist A')!;
    expect(vc.prefAmount).toBe(500_000);
    expect(vc.proRataAmount).toBe(0); // no remaining cash after pref
    expect(vc.total).toBe(500_000);
    // common/options get nothing
    const alice = result.segments.find((s) => s.name === 'Alice')!;
    expect(alice.total).toBe(0);
  });

  it('multiple preferred share shortfall pro-rata by entitlement', () => {
    const stakeholders = [
      ...initialStakeholders,
      {
        id: 'vc2',
        name: 'VC B',
        role: 'Investor',
        shareType: 'Preferred' as const,
        shares: 1_000_000,
        liquidationPref: 1,
        participating: false,
        prefPricePerShare: 2.0, // entitlement = 1 × $2 × 1M = $2,000,000
      },
    ];
    // total entitlement = 800k + 2M = 2.8M; exit = 1.4M (50% of entitlement)
    const result = calcWaterfall(stakeholders, 1_400_000, 'fullyDiluted');
    const vca = result.segments.find((s) => s.name === 'Venture Capitalist A')!;
    const vcb = result.segments.find((s) => s.name === 'VC B')!;
    expect(vca.prefAmount).toBe(400_000); // 800k × 0.5
    expect(vcb.prefAmount).toBe(1_000_000); // 2M × 0.5
    expect(result.totalPrefPaid).toBe(1_400_000);
  });

  it('no preferred: all cash distributed pro-rata to common + options', () => {
    const stakeholders = initialStakeholders.filter(
      (s) => s.shareType !== 'Preferred'
    );
    const result = calcWaterfall(stakeholders, 10_000_000, 'fullyDiluted');
    expect(result.totalPrefPaid).toBe(0);
    expect(result.remainingAfterPrefs).toBe(10_000_000);
    // pro-rata base = 9.2M, Alice = 4M/9.2M × 10M
    const alice = result.segments.find((s) => s.name === 'Alice')!;
    expect(alice.proRataAmount).toBeCloseTo((4_000_000 / 9_200_000) * 10_000_000, 0);
  });

  it('non-participating preferred gets pref only, no pro-rata', () => {
    const stakeholders = [
      ...initialStakeholders.filter((s) => s.name !== 'Venture Capitalist A'),
      {
        id: 'vcnp',
        name: 'VC Non-Part',
        role: 'Investor',
        shareType: 'Preferred' as const,
        shares: 800_000,
        liquidationPref: 1,
        participating: false,
        prefPricePerShare: 1.0,
      },
    ];
    const result = calcWaterfall(stakeholders, 15_000_000, 'fullyDiluted');
    const vc = result.segments.find((s) => s.name === 'VC Non-Part')!;
    expect(vc.prefAmount).toBe(800_000);
    expect(vc.proRataAmount).toBe(0); // not participating -> no extra
    expect(vc.total).toBe(800_000);
    // remaining 14.2M all goes to common/options
    const alice = result.segments.find((s) => s.name === 'Alice')!;
    expect(alice.proRataAmount).toBeCloseTo((4_000_000 / 9_200_000) * 14_200_000, 0);
  });

  it('zero exit value: everyone gets zero', () => {
    const result = calcWaterfall(initialStakeholders, 0, 'fullyDiluted');
    expect(result.totalPrefPaid).toBe(0);
    result.segments.forEach((s) => expect(s.total).toBe(0));
  });

  it('active mode uses effective shares (excludes pool) in pro-rata base', () => {
    const result = calcWaterfall(initialStakeholders, 15_000_000, 'active');
    // pool excluded -> proRataBase = 8.2M (4M+4M+200k), pool gets 0
    const pool = result.segments.find((s) => s.name === 'Unallocated Option Pool')!;
    expect(pool.proRataAmount).toBe(0);
  });
});
