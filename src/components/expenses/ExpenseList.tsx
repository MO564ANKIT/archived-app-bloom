import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { CategoryTag } from '@/components/kit/CategoryTag';
import { formatDayLabel, shiftDateKey } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { Expense } from '@/types';

interface ExpenseListProps {
  expenses: Expense[];
  today: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function dayHeading(date: string, today: string): string {
  if (date === today) return 'Today';
  if (date === shiftDateKey(today, -1)) return 'Yesterday';
  return formatDayLabel(date);
}

export function ExpenseList({ expenses, today, onEdit, onDelete }: ExpenseListProps) {
  const groups = expenses.reduce<Record<string, Expense[]>>((acc, expense) => {
    (acc[expense.date] ??= []).push(expense);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([date, items]) => (
        <section key={date}>
          <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-ink-400">{dayHeading(date, today)}</h3>
          <ul className="space-y-2">
            {items.map((expense) => (
              <li
                key={expense.id}
                className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-night-950/50 p-4 transition hover:border-white/20 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-ink-50">{expense.description}</p>
                    {expense.isSample && (
                      <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300">
                        SAMPLE
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    <CategoryTag category={expense.category} />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="font-display text-lg font-bold text-ink-50">{formatMoney(expense.amountPaise)}</p>
                  <div className="flex gap-1">
                    <Button variant="subtle" size="sm" onClick={() => onEdit(expense)} aria-label={`Edit ${expense.description}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="subtle" size="sm" onClick={() => onDelete(expense)} aria-label={`Delete ${expense.description}`}>
                      <Trash2 className="h-4 w-4 text-rose-300" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
