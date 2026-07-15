const intFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const usdCentsFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInt(n: number): string {
  return intFmt.format(Math.round(n));
}

export function formatUsd(n: number, cents = false): string {
  return (cents ? usdCentsFmt : usdFmt).format(n);
}

export function formatPct(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

const CENTS = 100;

export function roundToCents(n: number): number {
  return Math.round(n * CENTS) / CENTS;
}
