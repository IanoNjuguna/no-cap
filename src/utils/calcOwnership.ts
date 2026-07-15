import type {
  DilutionMode,
  Stakeholder,
  StakeholderWithOwnership,
  HealthStatus,
} from '../types';

export const POOL_ROLES = new Set(['Pool']);
export const UNALLOCATED_KEY = 'Unallocated Option Pool';

export function isUnallocatedPool(s: Stakeholder): boolean {
  return s.role === 'Pool' || POOL_ROLES.has(s.role) || s.name === UNALLOCATED_KEY;
}

export function effectiveShares(s: Stakeholder, mode: DilutionMode): number {
  if (mode === 'active' && isUnallocatedPool(s)) return 0;
  return Math.max(0, s.shares);
}

export function totalShares(stakeholders: Stakeholder[], mode: DilutionMode): number {
  return stakeholders.reduce((sum, s) => sum + effectiveShares(s, mode), 0);
}

export function calculatePercentages(
  stakeholders: Stakeholder[],
  mode: DilutionMode
): StakeholderWithOwnership[] {
  const total = totalShares(stakeholders, mode);
  return stakeholders.map((s) => ({
    ...s,
    ownershipPct: total > 0 ? (effectiveShares(s, mode) / total) * 100 : 0,
  }));
}

export function sumSharesByType(
  stakeholders: Stakeholder[],
  type: Stakeholder['shareType'],
  mode: DilutionMode
): number {
  return stakeholders
    .filter((s) => s.shareType === type)
    .reduce((sum, s) => sum + effectiveShares(s, mode), 0);
}

export function foundersPct(stakeholders: Stakeholder[], mode: DilutionMode): number {
  const total = totalShares(stakeholders, mode);
  if (total === 0) return 0;
  const founderCommon = stakeholders
    .filter((s) => s.role === 'Founder' && s.shareType === 'Common')
    .reduce((sum, s) => sum + effectiveShares(s, mode), 0);
  return (founderCommon / total) * 100;
}

export function poolPct(stakeholders: Stakeholder[], mode: DilutionMode): number {
  const total = totalShares(stakeholders, mode);
  if (total === 0) return 0;
  const pool = stakeholders
    .filter((s) => s.shareType === 'Options')
    .reduce((sum, s) => sum + effectiveShares(s, mode), 0);
  return (pool / total) * 100;
}

export function investorPct(stakeholders: Stakeholder[], mode: DilutionMode): number {
  const total = totalShares(stakeholders, mode);
  if (total === 0) return 0;
  const inv = stakeholders
    .filter((s) => s.shareType === 'Preferred')
    .reduce((sum, s) => sum + effectiveShares(s, mode), 0);
  return (inv / total) * 100;
}

const HEALTH_TOLERANCE = 0.01; // percentage points

export function checkHealth(
  stakeholders: Stakeholder[],
  mode: DilutionMode
): HealthStatus {
  const messages: string[] = [];

  for (const s of stakeholders) {
    if (s.shares < 0) {
      messages.push(`Negative share count for ${s.name}`);
    }
    if (!s.name.trim()) {
      messages.push('Stakeholder with empty name detected');
    }
  }

  const total = totalShares(stakeholders, mode);
  if (total === 0 && stakeholders.length > 0) {
    messages.push('Total shares are zero — add stakeholders to build the cap table');
  }

  const withPct = calculatePercentages(stakeholders, mode);
  const sumPct = withPct.reduce((acc, s) => acc + s.ownershipPct, 0);
  // Only flag ownership total when there are shares to distribute.
  if (total > 0 && Math.abs(sumPct - 100) > HEALTH_TOLERANCE) {
    messages.push(`Ownership total ${sumPct.toFixed(2)}% — check rounding or missing entries`);
  }

  return { healthy: messages.length === 0, messages };
}
