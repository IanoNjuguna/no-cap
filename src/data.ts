import type { Stakeholder } from './types';

export const initialStakeholders: Stakeholder[] = [
  {
    id: 'alice',
    name: 'Alice',
    role: 'Founder',
    shareType: 'Common',
    shares: 4_000_000,
    vested: true,
  },
  {
    id: 'bob',
    name: 'Bob',
    role: 'Founder',
    shareType: 'Common',
    shares: 4_000_000,
    vested: true,
  },
  {
    id: 'pool',
    name: 'Unallocated Option Pool',
    role: 'Pool',
    shareType: 'Options',
    shares: 1_000_000,
  },
  {
    id: 'charlie',
    name: 'Charlie',
    role: 'Employee',
    shareType: 'Options',
    shares: 200_000,
    vested: true,
  },
  {
    id: 'vca',
    name: 'Venture Capitalist A',
    role: 'Investor',
    shareType: 'Preferred',
    shares: 800_000,
    liquidationPref: 1,
    participating: true,
    prefPricePerShare: 1.0,
  },
];

export const CHART_COLORS: Record<string, string> = {
  Common: '#00FFC2', // mint
  Preferred: '#635BFF', // electric blue
  Options: '#FF4F00', // warning orange
};

export function colorForStakeholder(
  s: Stakeholder,
  index: number
): string {
  const base = CHART_COLORS[s.shareType] ?? '#00FFC2';
  // Vary shade slightly by index within a type so slices are distinguishable.
  if (s.shareType === 'Common') {
    const shades = ['#00FFC2', '#19E6B0'];
    return shades[index % shades.length];
  }
  if (s.shareType === 'Options') {
    const shades = ['#FF4F00', '#FF7A33', '#C73C00'];
    return shades[index % shades.length];
  }
  return base;
}
