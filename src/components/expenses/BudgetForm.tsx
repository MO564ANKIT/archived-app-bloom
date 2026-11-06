import { useState, type FormEvent } from 'react';
import { Button } from '@/components/kit/Button';
import { FormField } from '@/components/kit/FormField';
import { CATEGORIES, CATEGORY_META, type Category } from '@/lib/categories';
import { formatMoney, parseAmountToPaise } from '@/lib/money';
import type { GameState } from '@/types';

type BudgetsInput = {
  monthlyBudgetPaise: number | null;
  categoryBudgetsPaise: Partial<Record<Category, number>>;
};

const BUDGETABLE = CATEGORIES.filter((category) => category !== 'savings');

function toInputValue(paise: number | undefined): string {
  return paise === undefined ? '' : String(paise / 100);
}

interface BudgetFormProps {
  state: Pick<GameState, 'monthlyBudgetPaise' | 'categoryBudgetsPaise'>;
  onSave: (input: BudgetsInput) => void;
  onCancel: () => void;
}

export function BudgetForm({ state, onSave, onCancel }: BudgetFormProps) {
  const [monthly, setMonthly] = useState(toInputValue(state.monthlyBudgetPaise ?? undefined));
  const [categories, setCategories] = useState<Record<string, string>>(() =>
    Object.fromEntries(BUDGETABLE.map((category) => [category, toInputValue(state.categoryBudgetsPaise[category])])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const parseOptional = (raw: string, key: string): number | null | undefined => {
      if (raw.trim() === '') return null;
      const paise = parseAmountToPaise(raw);
      if (paise === null || paise <= 0) {
        nextErrors[key] = 'Enter a positive amount, or leave blank for no limit.';
        return undefined;
      }
      return paise;
    };

    const monthlyBudgetPaise = parseOptional(monthly, 'monthly');
    const categoryBudgetsPaise: Partial<Record<Category, number>> = {};
    for (const category of BUDGETABLE) {
      const parsed = parseOptional(categories[category], category);
      if (parsed) categoryBudgetsPaise[category] = parsed;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || monthlyBudgetPaise === undefined) return;
    onSave({ monthlyBudgetPaise, categoryBudgetsPaise });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <FormField
        label="Monthly budget (INR)"
        htmlFor="budget-monthly"
        error={errors.monthly}
        hint="Leave blank for no monthly limit. Every expense counts toward it."
      >
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink-300">₹</span>
          <input
            id="budget-monthly"
            inputMode="decimal"
            className="input pl-9"
            placeholder="25000"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
          />
        </div>
      </FormField>

      <div>
        <p className="label">Category budgets</p>
        <p className="mb-3 text-xs text-ink-400">Optional limits per category for this month.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUDGETABLE.map((category) => (
            <FormField key={category} label={CATEGORY_META[category].label} htmlFor={`budget-${category}`} error={errors[category]}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-300">₹</span>
                <input
                  id={`budget-${category}`}
                  inputMode="decimal"
                  className="input py-2.5 pl-8 text-sm"
                  placeholder="No limit"
                  value={categories[category]}
                  onChange={(event) => setCategories((prev) => ({ ...prev, [category]: event.target.value }))}
                />
              </div>
            </FormField>
          ))}
        </div>
      </div>

      <p className="rounded-2xl bg-night-950/60 p-3 text-xs text-ink-300">
        Current monthly budget: {state.monthlyBudgetPaise ? formatMoney(state.monthlyBudgetPaise) : 'not set'}
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save budgets
        </Button>
      </div>
    </form>
  );
}
