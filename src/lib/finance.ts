import { CATEGORIES, type Category } from '@/lib/categories';
import { monthKeyOf } from '@/lib/dates';
import { formatMoney, percentOf } from '@/lib/money';
import type { Expense, GameState } from '@/types';

type BudgetInputs = Pick<GameState, 'monthlyBudgetPaise' | 'categoryBudgetsPaise' | 'expenses'>;

export interface CategoryTotal {
  category: Category;
  spentPaise: number;
  budgetPaise: number | null;
  remainingPaise: number | null;
}

export interface MonthSummary {
  monthKey: string;
  budgetPaise: number | null;
  spentPaise: number;
  remainingPaise: number | null;
  usedPercent: number | null;
  expenseCount: number;
  categories: CategoryTotal[];
  topCategory: CategoryTotal | null;
}

export function summarizeMonth(state: BudgetInputs, monthKey: string): MonthSummary {
  const monthExpenses = state.expenses.filter((expense) => monthKeyOf(expense.date) === monthKey);
  const spentByCategory = new Map<Category, number>();
  let spentPaise = 0;

  for (const expense of monthExpenses) {
    spentPaise += expense.amountPaise;
    spentByCategory.set(expense.category, (spentByCategory.get(expense.category) ?? 0) + expense.amountPaise);
  }

  const categories = CATEGORIES.map((category) => {
    const spent = spentByCategory.get(category) ?? 0;
    const budget = state.categoryBudgetsPaise[category] ?? null;
    return {
      category,
      spentPaise: spent,
      budgetPaise: budget,
      remainingPaise: budget === null ? null : budget - spent,
    };
  })
    .filter((entry) => entry.spentPaise > 0 || entry.budgetPaise !== null)
    .sort((a, b) => b.spentPaise - a.spentPaise);

  const budgetPaise = state.monthlyBudgetPaise;

  return {
    monthKey,
    budgetPaise,
    spentPaise,
    remainingPaise: budgetPaise === null ? null : budgetPaise - spentPaise,
    usedPercent: budgetPaise === null ? null : percentOf(spentPaise, budgetPaise),
    expenseCount: monthExpenses.length,
    categories,
    topCategory: categories.find((entry) => entry.spentPaise > 0) ?? null,
  };
}

export function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export type Verdict = 'no-budget' | 'fits' | 'tight' | 'over' | 'category-over';

export interface Simulation {
  amountPaise: number;
  category: Category;
  monthlyBefore: number | null;
  monthlyAfter: number | null;
  categoryBefore: number | null;
  categoryAfter: number | null;
  monthlyOverPaise: number;
  categoryOverPaise: number;
  usedPercentAfter: number | null;
  verdict: Verdict;
}

const TIGHT_THRESHOLD_RATIO = 0.1;

export function simulatePurchase(summary: MonthSummary, amountPaise: number, category: Category): Simulation {
  const categoryEntry = summary.categories.find((entry) => entry.category === category);
  const monthlyBefore = summary.remainingPaise;
  const categoryBefore = categoryEntry?.remainingPaise ?? null;
  const monthlyAfter = monthlyBefore === null ? null : monthlyBefore - amountPaise;
  const categoryAfter = categoryBefore === null ? null : categoryBefore - amountPaise;

  let verdict: Verdict;
  if (monthlyAfter === null && categoryAfter === null) {
    verdict = 'no-budget';
  } else if (monthlyAfter !== null && monthlyAfter < 0) {
    verdict = 'over';
  } else if (categoryAfter !== null && categoryAfter < 0) {
    verdict = 'category-over';
  } else if (monthlyAfter !== null && summary.budgetPaise !== null && monthlyAfter < summary.budgetPaise * TIGHT_THRESHOLD_RATIO) {
    verdict = 'tight';
  } else {
    verdict = 'fits';
  }

  return {
    amountPaise,
    category,
    monthlyBefore,
    monthlyAfter,
    categoryBefore,
    categoryAfter,
    monthlyOverPaise: Math.max(0, -(monthlyAfter ?? 0)),
    categoryOverPaise: Math.max(0, -(categoryAfter ?? 0)),
    usedPercentAfter: summary.budgetPaise === null ? null : percentOf(summary.spentPaise + amountPaise, summary.budgetPaise),
    verdict,
  };
}

export interface Alternative {
  id: string;
  title: string;
  detail: string;
  remainingAfterPaise: number | null;
}

export function buildAlternatives(sim: Simulation, daysLeft: number): Alternative[] {
  const { amountPaise, monthlyBefore } = sim;
  const halfPrice = Math.round(amountPaise / 2);
  const dailySetAside = Math.ceil(amountPaise / Math.max(1, daysLeft));

  return [
    {
      id: 'buy-now',
      title: 'Buy it now',
      detail:
        sim.verdict === 'over' || sim.verdict === 'category-over'
          ? `You would be ${formatMoney(Math.max(sim.monthlyOverPaise, sim.categoryOverPaise))} past a limit. Expect a stern look from your monsters.`
          : 'Fastest route to the item. Your remaining budget takes the full hit right away.',
      remainingAfterPaise: sim.monthlyAfter,
    },
    {
      id: 'wait-week',
      title: 'Wait 7 days, then decide',
      detail: 'Nothing changes until you decide. Many urges fade within a week, and you keep every option open.',
      remainingAfterPaise: monthlyBefore,
    },
    {
      id: 'half-price',
      title: 'Find a half-price version',
      detail: `A ${formatMoney(halfPrice)} alternative keeps most of the fun and saves ${formatMoney(amountPaise - halfPrice)} compared with the original.`,
      remainingAfterPaise: monthlyBefore === null ? null : monthlyBefore - halfPrice,
    },
    {
      id: 'set-aside',
      title: 'Set money aside each day',
      detail: `Put ${formatMoney(dailySetAside)} aside daily for the rest of the month. The money stays in your budget but is reserved, so you only buy once it is fully saved.`,
      remainingAfterPaise: monthlyBefore,
    },
    {
      id: 'skip',
      title: 'Skip it',
      detail: 'You keep the full remaining budget and the money stays where it is. Skipping counts toward a quest.',
      remainingAfterPaise: monthlyBefore,
    },
  ];
}
