import { Pencil } from 'lucide-react';
import type { StakeholderWithOwnership } from '../types';
import { formatInt, formatPct } from '../utils/format';
import { CHART_COLORS } from '../data';

interface Props {
  stakeholder: StakeholderWithOwnership;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onEdit: (s: StakeholderWithOwnership) => void;
}

const ROLE_BADGE: Record<string, string> = {
  Founder: 'bg-mint/10 text-mint border-mint/20',
  Investor: 'bg-violet/10 text-violet border-violet/20',
  Employee: 'bg-danger/10 text-danger border-danger/20',
  Pool: 'bg-white/5 text-[#F0F6FC]/60 border-white/10',
};

export function StakeholderRow({ stakeholder, hovered, selected, onHover, onEdit }: Props) {
  const dot = CHART_COLORS[stakeholder.shareType] ?? '#00FFC2';
  const badge =
    ROLE_BADGE[stakeholder.role] ?? 'bg-white/5 text-[#F0F6FC]/60 border-white/10';

  return (
    <tr
      onMouseEnter={() => onHover(stakeholder.id)}
      onMouseLeave={() => onHover(null)}
      className={`group border-b border-border/40 transition-colors ${
        selected
          ? 'bg-mint/[0.06]'
          : hovered
            ? 'bg-white/[0.03]'
            : 'hover:bg-white/[0.02]'
      }`}
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
            aria-hidden
          />
          <span className="truncate text-sm font-medium text-[#F0F6FC]">
            {stakeholder.name}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${badge}`}
          >
            {stakeholder.role}
          </span>
          <span className="text-[10px] text-[#F0F6FC]/40">{stakeholder.shareType}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className="font-mono-tnum text-sm text-[#F0F6FC]/90">
          {formatInt(stakeholder.shares)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className="font-mono-tnum text-sm font-semibold text-[#F0F6FC]">
          {formatPct(stakeholder.ownershipPct)}
        </span>
      </td>
      <td className="px-2 py-2.5 text-right">
        <button
          onClick={() => onEdit(stakeholder)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#F0F6FC]/50 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-mint"
          aria-label={`Edit ${stakeholder.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
