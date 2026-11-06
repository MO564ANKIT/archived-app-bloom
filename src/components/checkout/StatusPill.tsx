import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/lib/ledger';

const STATUS: Record<OrderStatus, { label: string; className: string }> = {
  created: { label: 'Awaiting approval', className: 'bg-white/10 text-ink-200' },
  capturing: { label: 'Verifying', className: 'bg-aqua-500/15 text-aqua-300' },
  pending: { label: 'Pending', className: 'bg-aqua-500/15 text-aqua-300' },
  completed: { label: 'Verified', className: 'bg-neon-500/15 text-neon-300' },
  cancelled: { label: 'Cancelled', className: 'bg-amber-500/15 text-amber-300' },
  failed: { label: 'Failed', className: 'bg-rose-500/15 text-rose-300' },
  refunded: { label: 'Refunded', className: 'bg-volt-500/20 text-volt-300' },
};

export const STATUS_LABEL: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(STATUS).map(([key, value]) => [key, value.label]),
) as Record<OrderStatus, string>;

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const meta = STATUS[status] ?? STATUS.created;
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider', meta.className, className)}>
      {meta.label}
    </span>
  );
}
