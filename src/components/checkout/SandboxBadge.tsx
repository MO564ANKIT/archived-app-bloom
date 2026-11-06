import { FlaskConical } from 'lucide-react';
import { cn } from '@/lib/cn';

export function SandboxBadge({ className, label = 'PayPal Sandbox demo' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300',
        className,
      )}
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
