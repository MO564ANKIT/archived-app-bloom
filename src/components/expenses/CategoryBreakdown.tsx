import { motion } from 'framer-motion';
import { CATEGORY_META } from '@/lib/categories';
import { formatMoney } from '@/lib/money';
import type { MonthSummary } from '@/lib/finance';
import { cn } from '@/lib/cn';
import { categoryIcon } from '@/components/kit/categoryIcons';

export function CategoryBreakdown({ summary }: { summary: MonthSummary }) {
  const rows = summary.categories;
  if (rows.length === 0) {
    return <p className="text-sm text-ink-400">Category totals appear once you log an expense or set a category budget.</p>;
  }
  const maxSpent = Math.max(...rows.map((row) => row.spentPaise), 1);

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const Icon = categoryIcon(row.category);
        const overBudget = row.remainingPaise !== null && row.remainingPaise < 0;
        const share = row.budgetPaise && row.budgetPaise > 0
          ? Math.min(100, Math.round((row.spentPaise / row.budgetPaise) * 100))
          : Math.round((row.spentPaise / maxSpent) * 100);
        return (
          <li key={row.category}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-ink-100">
                <Icon className="h-4 w-4 text-neon-400" aria-hidden="true" />
                {CATEGORY_META[row.category].label}
              </span>
              <span className="text-right text-ink-200">
                <span className="font-bold text-ink-50">{formatMoney(row.spentPaise)}</span>
                {row.budgetPaise !== null && (
                  <span className={cn('ml-2 text-xs', overBudget ? 'text-rose-300' : 'text-ink-400')}>
                    {overBudget
                      ? `${formatMoney(Math.abs(row.remainingPaise ?? 0))} over`
                      : `${formatMoney(row.remainingPaise ?? 0)} left`}
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10" role="presentation">
              <motion.div
                className={cn('h-full rounded-full', overBudget ? 'bg-rose-400' : 'bg-gradient-to-r from-volt-500 to-neon-400')}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(share, row.spentPaise > 0 ? 3 : 0)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
