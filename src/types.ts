export type ShareType = 'Common' | 'Preferred' | 'Options';

export type Role = 'Founder' | 'Investor' | 'Employee' | 'Pool' | string;

export type DilutionMode = 'fullyDiluted' | 'active';

export interface Stakeholder {
  id: string;
  name: string;
  role: Role;
  shareType: ShareType;
  shares: number;
  vested?: boolean;
  liquidationPref?: number; // multiplier (e.g. 1 for 1x)
  participating?: boolean;
  prefPricePerShare?: number; // dollars
}

export interface StakeholderWithOwnership extends Stakeholder {
  ownershipPct: number; // 0-100
}

export interface WaterfallSegment {
  stakeholderId: string;
  name: string;
  prefAmount: number; // preference payout (0 for non-preferred)
  proRataAmount: number; // pro-rata remainder
  total: number; // prefAmount + proRataAmount
  pctOfExit: number; // total / exitValue * 100
}

export interface WaterfallResult {
  exitValue: number;
  totalPrefPaid: number;
  remainingAfterPrefs: number;
  remainingAfterParticipation: number;
  segments: WaterfallSegment[];
}

export interface HealthStatus {
  healthy: boolean;
  messages: string[];
}
