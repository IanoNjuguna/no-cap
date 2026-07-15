import { useState } from 'react';
import type { Stakeholder, WaterfallSegment } from '../types';
import { formatUsd } from '../utils/format';
import { CHART_COLORS } from '../data';

interface Props {
  segment: WaterfallSegment;
  stakeholder: Stakeholder;
  maxTotal: number;
  formula?: string;
}

// Pref payout uses a warning/orange-tinted shade; pro-rata uses the type color.
const PREF_COLOR = '#FF4F00';

export function WaterfallBar({ segment, stakeholder, maxTotal, formula }: Props) {
  const [showTip, setShowTip] = useState(false);
  const typeColor = CHART_COLORS[stakeholder.shareType] ?? '#00FFC2';
  const widthPct = maxTotal > 0 ? (segment.total / maxTotal) * 100 : 0;
  const prefPct = segment.total > 0 ? (segment.prefAmount / segment.total) * 100 : 0;
  const proPct = 100 - prefPct;

  const hasPref = segment.prefAmount > 0;
  const hasPro = segment.proRataAmount > 0;

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="w-28 shrink-0 truncate text-[#F0F6FC]/70">{segment.name}</span>
        <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-white/[0.03]">
          {widthPct > 0 && (
            <div
              className="flex h-full rounded-sm transition-all duration-300"
              style={{ width: `${widthPct}%` }}
            >
              {hasPref && (
                <div
                  className="h-full"
                  style={{ width: `${prefPct}%`, backgroundColor: PREF_COLOR }}
                />
              )}
              {hasPro && (
                <div
                  className="h-full"
                  style={{ width: `${proPct}%`, backgroundColor: typeColor }}
                />
              )}
            </div>
          )}
        </div>
        <span className="w-24 shrink-0 text-right font-mono-tnum text-[#F0F6FC]">
          {formatUsd(segment.total)}
        </span>
        <span className="w-14 shrink-0 text-right font-mono-tnum text-[#F0F6FC]/50">
          {segment.pctOfExit.toFixed(1)}%
        </span>
      </div>

      {showTip && formula && (
        <div className="pointer-events-none absolute left-32 top-7 z-30 w-64 animate-fade-in whitespace-pre-line rounded-md border border-border bg-bg/95 p-2.5 text-[11px] leading-relaxed text-[#F0F6FC]/80 shadow-xl">
          <div className="mb-1 flex items-center gap-2 font-medium text-[#F0F6FC]">
            {segment.name}
            <span className="font-mono-tnum text-mint">{formatUsd(segment.total)}</span>
          </div>
          {hasPref && (
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: PREF_COLOR }} />
              Pref: <span className="font-mono-tnum">{formatUsd(segment.prefAmount, true)}</span>
            </div>
          )}
          {hasPro && (
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: typeColor }} />
              Pro-rata: <span className="font-mono-tnum">{formatUsd(segment.proRataAmount, true)}</span>
            </div>
          )}
          <div className="mt-1.5 border-t border-border pt-1.5 font-mono-tnum text-[10px] text-[#F0F6FC]/50">
            {formula}
          </div>
        </div>
      )}
    </div>
  );
}
