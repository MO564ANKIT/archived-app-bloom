import { ArrowRight, Receipt } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { CategoryTag } from '@/components/kit/CategoryTag';
import { dayHeading } from '@/components/expenses/ExpenseList';
import { formatMoney } from '@/lib/money';
import type { Expense } from '@/types';

const RECENT_LIMIT = 5;

interface RecentExpensesProps {
  expenses: Expense[];
  today: string;
  onViewAll: () => void;
}

export function RecentExpenses({ expenses, today, onViewAll }: RecentExpensesProps) {
  const recent = [...expenses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_LIMIT);

  return (
    <section className="card p-6 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
            <Receipt className="h-5 w-5 text-neon-300" /> Recent expenses
          </h2>
          <p className="mt-1 text-sm text-ink-300">Your latest {RECENT_LIMIT} entries, newest first.</p>
        </div>
        <Button variant="subtle" size="sm" onClick={onViewAll}>
          All expenses <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {recent.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-ink-300">
          No expenses logged yet. Log your first one to feed your monsters.
        </p>
      ) : (
        <ul className="divide-y divide-white/10">
          {recent.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-ink-50">{expense.description}</p>
                  {expense.isSample && (
                    <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
                      SAMPLE
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <CategoryTag category={expense.category} />
                  <span className="text-xs text-ink-400">{dayHeading(expense.date, today)}</span>
                </div>
              </div>
              <p className="shrink-0 font-display text-lg font-bold text-ink-50">{formatMoney(expense.amountPaise)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
