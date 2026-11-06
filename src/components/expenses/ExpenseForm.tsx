import { useState, type FormEvent } from 'react';
import { Button } from '@/components/kit/Button';
import { FormField } from '@/components/kit/FormField';
import { CATEGORIES, CATEGORY_META, type Category } from '@/lib/categories';
import { parseAmountToPaise } from '@/lib/money';
import { categoryIcon } from '@/components/kit/categoryIcons';
import type { ExpenseInput } from '@/state/gameContext';
import type { Expense } from '@/types';
import { cn } from '@/lib/cn';

type FieldErrors = Partial<Record<'amount' | 'date' | 'description', string>>;

const MAX_DESCRIPTION = 80;

interface ExpenseFormProps {
  initial?: Expense;
  today: string;
  onSubmit: (input: ExpenseInput) => void;
  onCancel: () => void;
}

export function ExpenseForm({ initial, today, onSubmit, onCancel }: ExpenseFormProps) {
  const [amount, setAmount] = useState(initial ? String(initial.amountPaise / 100) : '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'food');
  const [date, setDate] = useState(initial?.date ?? today);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const amountPaise = parseAmountToPaise(amount);
    const trimmedDescription = description.trim();

    if (amountPaise === null) {
      nextErrors.amount = 'Enter an amount like 249 or 249.50.';
    } else if (amountPaise <= 0) {
      nextErrors.amount = 'The amount must be more than zero.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !date) {
      nextErrors.date = 'Pick a valid date.';
    } else if (date > today) {
      nextErrors.date = 'Expenses cannot be dated in the future.';
    }
    if (trimmedDescription.length === 0) {
      nextErrors.description = 'Add a short description so future you remembers.';
    } else if (trimmedDescription.length > MAX_DESCRIPTION) {
      nextErrors.description = `Keep it under ${MAX_DESCRIPTION} characters.`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || amountPaise === null) return;

    onSubmit({ amountPaise, category, date, description: trimmedDescription });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField label="Amount (INR)" htmlFor="expense-amount" error={errors.amount} hint="Use paise for fractions, e.g. 99.50">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-ink-300">₹</span>
          <input
            id="expense-amount"
            inputMode="decimal"
            autoComplete="off"
            className="input pl-9 text-lg font-bold"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={Boolean(errors.amount)}
          />
        </div>
      </FormField>

      <div>
        <span className="label">Category</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((option) => {
            const Icon = categoryIcon(option);
            const selected = option === category;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(option)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition',
                  selected
                    ? 'border-neon-400 bg-neon-500/15 text-neon-300 shadow-glow-neon'
                    : 'border-white/10 bg-night-950/50 text-ink-200 hover:border-white/25',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="leading-tight">{CATEGORY_META[option].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <FormField label="Date" htmlFor="expense-date" error={errors.date}>
        <input
          id="expense-date"
          type="date"
          max={today}
          className="input"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-invalid={Boolean(errors.date)}
        />
      </FormField>

      <FormField label="Description" htmlFor="expense-description" error={errors.description}>
        <input
          id="expense-description"
          className="input"
          placeholder="Iced latte with oat milk"
          maxLength={MAX_DESCRIPTION + 20}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-invalid={Boolean(errors.description)}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initial ? 'Save changes' : 'Log expense'}
        </Button>
      </div>
    </form>
  );
}
