import type {
  DilutionMode,
  Stakeholder,
  WaterfallResult,
  WaterfallSegment,
} from '../types';
import { effectiveShares, totalShares } from './calcOwnership';
import { roundToCents } from './format';

/**
 * Liquidation waterfall (participating preferred) following the spec:
 *
 *  1. Pay liquidation preferences to Preferred holders first (capped by remaining cash).
 *     If exitValue < sum(pref entitlements), prefs share the shortfall pro-rata by entitlement.
 *  2. Participating Preferred then take their pro-rata slice of the cash left after prefs.
 *  3. Remaining cash is split pro-rata among Common + Options holders (and participating
 *     Preferred are already removed from that pool). proRataBase = sum(effective Common + Options).
 */
export function calcWaterfall(
  stakeholders: Stakeholder[],
  exitValue: number,
  mode: DilutionMode
): WaterfallResult {
  const total = totalShares(stakeholders, mode);
  const exit = Math.max(0, exitValue);

  // --- Step 1: liquidation preferences ---
  // Each preferred holder's full entitlement = liquidationPref * prefPricePerShare * shares.
  const preferred = stakeholders.filter((s) => s.shareType === 'Preferred');
  const prefEntitlements = preferred.map((s) => ({
    stakeholder: s,
    entitlement: prefEntitlement(s),
  }));
  const totalEntitlement = prefEntitlements.reduce((acc, p) => acc + p.entitlement, 0);

  // Determine actual pref payout per holder. If cash is short, distribute pro-rata by entitlement.
  const prefShortfall = exit < totalEntitlement;
  const prefScale = totalEntitlement > 0 && prefShortfall ? exit / totalEntitlement : 1;

  const prefPaid = new Map<string, number>();
  let remainingAfterPrefs = exit;
  for (const { stakeholder, entitlement } of prefEntitlements) {
    const amount = entitlement * prefScale;
    prefPaid.set(stakeholder.id, roundToCents(amount));
    remainingAfterPrefs -= amount;
  }
  remainingAfterPrefs = Math.max(0, roundToCents(remainingAfterPrefs));

  // --- Step 2: participating preferred pro-rata of remaining cash ---
  const participating = preferred.filter((s) => s.participating);
  const participatingShares = participating.reduce(
    (acc, s) => acc + effectiveShares(s, mode),
    0
  );

  const participationPaid = new Map<string, number>();
  let remainingAfterParticipation = remainingAfterPrefs;
  if (participatingShares > 0 && total > 0 && remainingAfterPrefs > 0) {
    for (const s of participating) {
      // ownership % for participation = shares / totalShares (current dilution mode)
      const ownership = effectiveShares(s, mode) / total;
      const amount = ownership * remainingAfterPrefs;
      participationPaid.set(s.id, roundToCents(amount));
      remainingAfterParticipation -= amount;
    }
    remainingAfterParticipation = Math.max(0, roundToCents(remainingAfterParticipation));
  }

  // --- Step 3: distribute remaining to Common + Options pro-rata ---
  const proRataEligible = stakeholders.filter(
    (s) => s.shareType === 'Common' || s.shareType === 'Options'
  );
  const proRataBase = proRataEligible.reduce(
    (acc, s) => acc + effectiveShares(s, mode),
    0
  );

  const proRataPaid = new Map<string, number>();
  if (proRataBase > 0 && remainingAfterParticipation > 0) {
    for (const s of proRataEligible) {
      const amount = (effectiveShares(s, mode) / proRataBase) * remainingAfterParticipation;
      proRataPaid.set(s.id, roundToCents(amount));
    }
  }

  // --- Assemble per-stakeholder segments (preserve input order) ---
  const segments: WaterfallSegment[] = stakeholders.map((s) => {
    const prefAmount = prefPaid.get(s.id) ?? 0;
    const proRataAmount = participationPaid.get(s.id) ?? proRataPaid.get(s.id) ?? 0;
    const segTotal = roundToCents(prefAmount + proRataAmount);
    return {
      stakeholderId: s.id,
      name: s.name,
      prefAmount,
      proRataAmount,
      total: segTotal,
      pctOfExit: exit > 0 ? (segTotal / exit) * 100 : 0,
    };
  });

  const totalPrefPaid = roundToCents(
    Array.from(prefPaid.values()).reduce((a, b) => a + b, 0)
  );

  return {
    exitValue: exit,
    totalPrefPaid,
    remainingAfterPrefs,
    remainingAfterParticipation,
    segments,
  };
}

/** Full liquidation preference entitlement for a preferred holder (not capped by cash). */
export function prefEntitlement(s: Stakeholder): number {
  if (s.shareType !== 'Preferred') return 0;
  const multiplier = s.liquidationPref ?? 1;
  const price = s.prefPricePerShare ?? 0;
  return roundToCents(multiplier * price * Math.max(0, s.shares));
}

export function waterfallFormulaBreakdown(
  s: Stakeholder,
  mode: DilutionMode,
  total: number,
  result: WaterfallResult,
  seg: WaterfallSegment
): string {
  if (s.shareType === 'Preferred') {
    const mult = s.liquidationPref ?? 1;
    const price = s.prefPricePerShare ?? 0;
    const parts: string[] = [];
    parts.push(
      `Pref: ${mult}x × $${price.toFixed(2)} × ${s.shares.toLocaleString()} = $${roundToCents(
        mult * price * s.shares
      ).toLocaleString()}`
    );
    if (result.totalPrefPaid < prefEntitlement(s) && result.totalPrefPaid > 0) {
      const scale = result.totalPrefPaid / prefEntitlement(s);
      parts.push(`Cash short — prefs paid pro-rata (${(scale * 100).toFixed(1)}% of entitlement)`);
    }
    if (s.participating && seg.proRataAmount > 0) {
      const ownership = (effectiveShares(s, mode) / total) * 100;
      parts.push(
        `Participating: ${ownership.toFixed(2)}% × $${result.remainingAfterPrefs.toLocaleString()} = $${seg.proRataAmount.toLocaleString()}`
      );
    }
    return parts.join('\n');
  }
  // Common / Options
  return `Pro-rata: (${s.shares.toLocaleString()} / base) × remaining = $${seg.proRataAmount.toLocaleString()}`;
}
