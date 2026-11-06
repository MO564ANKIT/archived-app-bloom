import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-night-950/40 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-volt-400/15 text-volt-300">
        {icon ?? <Lock className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-bold text-ink-50">{title}</h3>
      <p className="max-w-sm text-sm text-ink-300">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
