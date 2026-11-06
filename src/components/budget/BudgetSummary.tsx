import { motion } from 'framer-motion';
import { budgetTone } from '@/components/budget/budgetTone';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { formatMoney } from '@/lib/money';
import { formatMonthLabel } from '@/lib/dates';
import type { MonthSummary } from '@/lib/finance';
import { cn } from '@/lib/cn';

interface BudgetSummaryProps {
  summary: MonthSummary;
}

export function BudgetSummary({ summary }: BudgetSummaryProps) {
  const over = summary.remainingPaise !== null && summary.remainingPaise < 0;
  const tiles = [
    { label: 'Spent this month', value: formatMoney(summary.spentPaise), tone: 'text-amber-300' },
    {
      label: 'Monthly budget',
      value: summary.budgetPaise === null ? 'Not set' : formatMoney(summary.budgetPaise),
      tone: 'text-ink-50',
    },
    {
      label: over ? 'Over budget by' : 'Remaining',
      value:
        summary.remainingPaise === null
          ? 'Set a budget'
          : formatMoney(Math.abs(summary.remainingPaise)),
      tone: over ? 'text-rose-300' : 'text-neon-300',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-white/10 bg-night-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{tile.label}</p>
            <p className={cn('mt-1.5 font-display text-2xl font-bold', tile.tone)}>{tile.value}</p>
          </div>
        ))}
      </div>
      {summary.usedPercent !== null ? (
        <div>
          <div className="mb-2 flex justify-between text-xs font-medium text-ink-300">
            <span>{formatMonthLabel(summary.monthKey)}</span>
            <motion.span key={summary.usedPercent} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {summary.usedPercent}% used
            </motion.span>
          </div>
          <ProgressBar value={summary.usedPercent} tone={budgetTone(summary.usedPercent)} label="Monthly budget used" />
        </div>
      ) : (
        <p className="text-xs text-ink-400">Set a monthly budget to see how much is left.</p>
      )}
    </div>
  );
}
