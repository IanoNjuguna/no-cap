import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { HealthStatus } from '../types';

interface Props {
  health: HealthStatus;
  className?: string;
}

export function HealthBadge({ health, className = '' }: Props) {
  if (health.healthy) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-md border border-mint/30 bg-mint/10 px-2.5 py-1 text-xs font-medium text-mint ${className}`}
        role="status"
        aria-label="Cap table healthy"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Cap Table Healthy
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-start gap-1.5 rounded-md border border-danger/40 bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger ${className}`}
      role="alert"
      aria-label="Cap table warning"
    >
      <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        {health.messages.map((m, i) => (
          <span key={i}>{m}</span>
        ))}
      </div>
    </div>
  );
}
