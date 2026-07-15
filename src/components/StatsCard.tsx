import { TrendingUp, Users, Layers, Building2 } from 'lucide-react';
import { formatInt, formatPct } from '../utils/format';

interface StatItem {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  accent: string;
}

interface Props {
  totalShares: number;
  foundersPct: number;
  poolPct: number;
  investorPct: number;
}

export function StatsCard({ totalShares, foundersPct, poolPct, investorPct }: Props) {
  const stats: StatItem[] = [
    {
      label: 'Total Shares',
      value: formatInt(totalShares),
      icon: Layers,
      accent: 'text-[#F0F6FC]',
    },
    {
      label: "Founders' Share",
      value: formatPct(foundersPct),
      icon: Users,
      accent: 'text-mint',
    },
    {
      label: 'Option Pool',
      value: formatPct(poolPct),
      icon: TrendingUp,
      accent: 'text-danger',
    },
    {
      label: 'Investors',
      value: formatPct(investorPct),
      icon: Building2,
      accent: 'text-violet',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-lg border border-border/60 bg-card/60 p-3 ring-1 ring-inset ring-white/[0.02]"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#F0F6FC]/50">
              <Icon className="h-3 w-3" />
              {s.label}
            </div>
            <div className={`mt-1 font-mono-tnum text-lg font-semibold ${s.accent}`}>
              {s.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
