import { useMemo } from 'react';
import { SlidersHorizontal, CircleDollarSign } from 'lucide-react';
import type { CapTable } from '../hooks/useCapTable';
import { formatUsd, formatInt } from '../utils/format';
import { WaterfallBar } from './WaterfallBar';
import { waterfallFormulaBreakdown } from '../utils/calcWaterfall';
import { effectiveShares } from '../utils/calcOwnership';

interface Props {
  cap: CapTable;
}

const MAX_EXIT = 50_000_000;

export function ExitSimulator({ cap }: Props) {
  const { waterfall, stakeholders, exitValue, setExitValue, mode, totalShares } = cap;

  const maxTotal = useMemo(
    () => waterfall.segments.reduce((m, s) => Math.max(m, s.total), 0),
    [waterfall.segments]
  );

  const segmentsWithStakeholders = useMemo(
    () =>
      waterfall.segments
        .map((seg) => ({
          seg,
          sh: stakeholders.find((s) => s.id === seg.stakeholderId)!,
        }))
        .filter((x) => x.sh),
    [waterfall.segments, stakeholders]
  );

  return (
    <section
      className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/40"
      aria-label="Exit simulator"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SlidersHorizontal className="h-4 w-4 text-mint" />
        <h2 className="text-sm font-semibold tracking-tight text-[#F0F6FC]">
          Exit Simulator
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        {/* Slider */}
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="exit-slider" className="text-xs font-medium uppercase tracking-wide text-[#F0F6FC]/55">
              Exit Valuation
            </label>
            <span className="font-mono-tnum text-lg font-semibold text-mint">
              {formatUsd(exitValue)}
            </span>
          </div>
          <input
            id="exit-slider"
            type="range"
            min={0}
            max={MAX_EXIT}
            step={100_000}
            value={exitValue}
            onChange={(e) => setExitValue(Number(e.target.value))}
            className="w-full accent-mint"
            aria-valuemin={0}
            aria-valuemax={MAX_EXIT}
            aria-valuenow={exitValue}
            aria-valuetext={`${formatUsd(exitValue)}`}
          />
          <div className="mt-1 flex justify-between text-[10px] font-mono-tnum text-[#F0F6FC]/30">
            <span>$0</span>
            <span>$25M</span>
            <span>$50M</span>
          </div>
        </div>

        {/* Summary chips */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border/60 bg-bg/40 p-2">
            <div className="text-[10px] uppercase tracking-wide text-[#F0F6FC]/45">
              Pref Paid
            </div>
            <div className="font-mono-tnum text-sm font-semibold text-danger">
              {formatUsd(waterfall.totalPrefPaid)}
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-bg/40 p-2">
            <div className="text-[10px] uppercase tracking-wide text-[#F0F6FC]/45">
              After Pref
            </div>
            <div className="font-mono-tnum text-sm font-semibold text-[#F0F6FC]/80">
              {formatUsd(waterfall.remainingAfterPrefs)}
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-bg/40 p-2">
            <div className="text-[10px] uppercase tracking-wide text-[#F0F6FC]/45">
              To Common/Opts
            </div>
            <div className="font-mono-tnum text-sm font-semibold text-mint">
              {formatUsd(waterfall.remainingAfterParticipation)}
            </div>
          </div>
        </div>

        {/* Waterfall bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#F0F6FC]/40">
            <CircleDollarSign className="h-3 w-3" />
            Cash allocation per stakeholder
          </div>
          {segmentsWithStakeholders.map(({ seg, sh }) => (
            <WaterfallBar
              key={seg.stakeholderId}
              segment={seg}
              stakeholder={sh}
              maxTotal={maxTotal}
              formula={waterfallFormulaBreakdown(sh, mode, totalShares, waterfall, seg)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-3 text-[11px] text-[#F0F6FC]/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#FF4F00' }} />
            Preference payout
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-mint" />
            Pro-rata (by share type)
          </span>
        </div>

        {/* Summary table */}
        <div className="mt-4 overflow-hidden rounded-md border border-border/50">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wide text-[#F0F6FC]/40">
              <tr>
                <th className="px-2.5 py-1.5 text-left font-medium">Stakeholder</th>
                <th className="px-2.5 py-1.5 text-right font-medium">Cash</th>
                <th className="px-2.5 py-1.5 text-right font-medium">% Exit</th>
              </tr>
            </thead>
            <tbody>
              {segmentsWithStakeholders.map(({ seg, sh }) => (
                <tr key={seg.stakeholderId} className="border-t border-border/30">
                  <td className="px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: sh.shareType === 'Preferred' ? '#635BFF' : sh.shareType === 'Options' ? '#FF4F00' : '#00FFC2' }}
                      />
                      {seg.name}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono-tnum text-[#F0F6FC]">
                    {formatUsd(seg.total, true)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono-tnum text-[#F0F6FC]/60">
                    {seg.pctOfExit.toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="border-t border-border bg-white/[0.03] font-semibold">
                <td className="px-2.5 py-1.5 text-[#F0F6FC]">Total</td>
                <td className="px-2.5 py-1.5 text-right font-mono-tnum text-mint">
                  {formatUsd(
                    segmentsWithStakeholders.reduce((a, x) => a + x.seg.total, 0),
                    true
                  )}
                </td>
                <td className="px-2.5 py-1.5 text-right font-mono-tnum text-[#F0F6FC]/60">
                  100.00%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Effective shares note */}
        <p className="mt-3 text-[10px] text-[#F0F6FC]/35">
          Pro-rata base: {formatInt(
            stakeholders
              .filter((s) => s.shareType === 'Common' || s.shareType === 'Options')
              .reduce((a, s) => a + effectiveShares(s, mode), 0)
          )} shares (Common + Options, {mode === 'fullyDiluted' ? 'fully diluted' : 'active'}).
        </p>
      </div>
    </section>
  );
}
