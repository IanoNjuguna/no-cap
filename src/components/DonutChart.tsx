import { useMemo, useState } from 'react';
import type { StakeholderWithOwnership } from '../types';
import { formatInt, formatPct } from '../utils/format';
import { colorForStakeholder } from '../data';

interface Props {
  data: StakeholderWithOwnership[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const SIZE = 220;
const R = 88;
const INNER = 56;
const CX = SIZE / 2;
const CY = SIZE / 2;

interface Arc {
  id: string;
  name: string;
  shares: number;
  ownershipPct: number;
  color: string;
  path: string;
  largeArc: number;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const so = polar(cx, cy, rOuter, end);
  const eo = polar(cx, cy, rOuter, start);
  const si = polar(cx, cy, rInner, start);
  const ei = polar(cx, cy, rInner, end);
  const largeArc = end - start <= 180 ? 0 : 1;
  return [
    `M ${so.x} ${so.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${eo.x} ${eo.y}`,
    `L ${si.x} ${si.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
}

export function DonutChart({ data, hoveredId, selectedId, onHover, onSelect }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; id: string } | null>(null);

  const arcs = useMemo<Arc[]>(() => {
    const total = data.reduce((a, s) => a + s.ownershipPct, 0);
    if (total <= 0) return [];
    let angle = 0;
    let idxByType: Record<string, number> = {};
    return data.map((s) => {
      const idx = idxByType[s.shareType] ?? 0;
      idxByType[s.shareType] = idx + 1;
      const sweep = (s.ownershipPct / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      return {
        id: s.id,
        name: s.name,
        shares: s.shares,
        ownershipPct: s.ownershipPct,
        color: colorForStakeholder(s, idx),
        path: arcPath(CX, CY, R, INNER, start, end),
        largeArc: end - start > 180 ? 1 : 0,
      };
    });
  }, [data]);

  const totalShares = data.reduce((a, s) => a + s.shares, 0);
  const activeId = hoveredId ?? selectedId;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" role="img" aria-label="Ownership donut chart">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {arcs.length === 0 && (
            <circle
              cx={CX}
              cy={CY}
              r={(R + INNER) / 2}
              fill="none"
              stroke="#30363D"
              strokeWidth={R - INNER}
              opacity={0.4}
            />
          )}
          {arcs.map((a) => {
            const isActive = activeId === a.id;
            const dimmed = activeId !== null && !isActive;
            const midAngle = (() => {
              // recompute start to find label midpoint
              let acc = 0;
              for (const x of arcs) {
                if (x.id === a.id) break;
                acc += (x.ownershipPct / 100) * 360;
              }
              return acc + (a.ownershipPct / 100) * 180;
            })();
            const labelPos = polar(CX, CY, (R + INNER) / 2, midAngle);
            return (
              <path
                key={a.id}
                d={a.path}
                fill={a.color}
                stroke="#0D0E11"
                strokeWidth={1.5}
                opacity={dimmed ? 0.35 : 1}
                style={{
                  transition: 'opacity 120ms, transform 120ms',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                  transformOrigin: `${CX}px ${CY}px`,
                  cursor: 'pointer',
                }}
                tabIndex={0}
                role="button"
                aria-label={`${a.name}: ${formatPct(a.ownershipPct)} (${formatInt(a.shares)} shares)`}
                onMouseEnter={(e) => {
                  onHover(a.id);
                  setTooltip({ x: e.clientX, y: e.clientY, id: a.id });
                }}
                onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, id: a.id })}
                onMouseLeave={() => {
                  onHover(null);
                  setTooltip(null);
                }}
                onClick={() => onSelect(a.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(a.id);
                  }
                }}
                onFocus={() => onHover(a.id)}
                onBlur={() => onHover(null)}
              >
                {a.ownershipPct >= 6 && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-mono-tnum"
                    fontSize={10}
                    fontWeight={600}
                    fill="#0D0E11"
                    style={{ pointerEvents: 'none' }}
                  >
                    {a.ownershipPct.toFixed(0)}%
                  </text>
                )}
              </path>
            );
          })}
          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#F0F6FC"
            opacity={0.5}
            style={{ pointerEvents: 'none' }}
          >
            TOTAL
          </text>
          <text
            x={CX}
            y={CY + 10}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            fill="#F0F6FC"
            className="font-mono-tnum"
            style={{ pointerEvents: 'none' }}
          >
            {formatInt(totalShares)}
          </text>
        </svg>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 animate-fade-in rounded-md border border-border bg-bg/95 px-2.5 py-1.5 text-xs shadow-xl"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            {(() => {
              const a = arcs.find((x) => x.id === tooltip.id);
              if (!a) return null;
              return (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-[#F0F6FC]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: a.color }}
                    />
                    {a.name}
                  </div>
                  <div className="font-mono-tnum text-[#F0F6FC]/70">
                    {formatInt(a.shares)} shares
                  </div>
                  <div className="font-mono-tnum font-semibold text-mint">
                    {formatPct(a.ownershipPct)}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <ul className="grid w-full grid-cols-1 gap-1" aria-label="Donut legend">
        {arcs.map((a) => (
          <li key={a.id}>
            <button
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition ${
                activeId === a.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
              onMouseEnter={() => onHover(a.id)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(a.id)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: a.color }}
              />
              <span className="flex-1 truncate text-[#F0F6FC]/80">{a.name}</span>
              <span className="font-mono-tnum font-medium text-[#F0F6FC]">
                {formatPct(a.ownershipPct)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
