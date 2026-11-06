import { describe, expect, it } from 'vitest';
import { simulatePurchase, summarizeMonth } from '@/lib/finance';
import type { Expense } from '@/types';

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: overrides.id ?? 'e1',
    amountPaise: 10_000,
    category: 'food',
    date: '2025-06-10',
    description: '',
    isSample: false,
    createdAt: '2025-06-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('summarizeMonth', () => {
  const state = {
    monthlyBudgetPaise: 100_000,
    categoryBudgetsPaise: { food: 30_000 },
    expenses: [
      expense({ id: 'a', amountPaise: 20_000, category: 'food', date: '2025-06-01' }),
      expense({ id: 'b', amountPaise: 15_000, category: 'fun', date: '2025-06-03' }),
      expense({ id: 'c', amountPaise: 50_000, category: 'bills', date: '2025-05-20' }),
    ],
  };

  it('totals only the requested month', () => {
    const summary = summarizeMonth(state, '2025-06');
    expect(summary.spentPaise).toBe(35_000);
    expect(summary.expenseCount).toBe(2);
    expect(summary.remainingPaise).toBe(65_000);
    expect(summary.usedPercent).toBe(35);
  });

  it('reports remaining category budget and the top spending category', () => {
    const summary = summarizeMonth(state, '2025-06');
    const food = summary.categories.find((entry) => entry.category === 'food');
    expect(food?.remainingPaise).toBe(10_000);
    expect(summary.topCategory?.category).toBe('food');
  });

  it('leaves budget fields empty when no budget is set', () => {
    const summary = summarizeMonth({ ...state, monthlyBudgetPaise: null }, '2025-06');
    expect(summary.remainingPaise).toBeNull();
    expect(summary.usedPercent).toBeNull();
  });
});

describe('simulatePurchase', () => {
  const summary = summarizeMonth(
    {
      monthlyBudgetPaise: 100_000,
      categoryBudgetsPaise: { shopping: 40_000 },
      expenses: [expense({ amountPaise: 20_000, category: 'shopping', date: '2025-06-02' })],
    },
    '2025-06',
  );

  it('says a purchase fits when both budgets have room', () => {
    expect(simulatePurchase(summary, 5_000, 'shopping').verdict).toBe('fits');
  });

  it('flags a purchase that breaks the category budget', () => {
    expect(simulatePurchase(summary, 25_000, 'shopping').verdict).toBe('category-over');
  });

  it('flags a purchase that breaks the monthly budget and reports the overspend', () => {
    const sim = simulatePurchase(summary, 90_000, 'food');
    expect(sim.verdict).toBe('over');
    expect(sim.monthlyOverPaise).toBe(10_000);
  });

  it('cannot judge a purchase when no budget exists', () => {
    const open = summarizeMonth({ monthlyBudgetPaise: null, categoryBudgetsPaise: {}, expenses: [] }, '2025-06');
    expect(simulatePurchase(open, 5_000, 'fun').verdict).toBe('no-budget');
  });
});
