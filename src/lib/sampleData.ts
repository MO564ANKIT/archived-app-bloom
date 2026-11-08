import { MONSTER_IDS, applyExpenseXp } from '@/lib/monsters';
import { dateKey } from '@/lib/dates';
import { finalizeState } from '@/lib/progress';
import type { Category } from '@/lib/categories';
import type { Expense, GameState, MonsterId, MonsterProgress } from '@/types';

export const SAMPLE_MONTHLY_BUDGET_PAISE = 2_500_000;

export const SAMPLE_CATEGORY_BUDGETS: Partial<Record<Category, number>> = {
  food: 400_000,
  coffee: 150_000,
  shopping: 300_000,
  subscriptions: 150_000,
  fun: 200_000,
};

interface SampleEntry {
  daysAgo: number;
  rupees: number;
  category: Category;
  description: string;
}

const SAMPLE_ENTRIES: SampleEntry[] = [
  { daysAgo: 0, rupees: 349, category: 'coffee', description: 'Cold brew at the corner cafe' },
  { daysAgo: 0, rupees: 689, category: 'food', description: 'Late-night burrito bowl' },
  { daysAgo: 1, rupees: 199, category: 'subscriptions', description: 'Music streaming' },
  { daysAgo: 1, rupees: 1299, category: 'shopping', description: 'Sneakers that were "on sale"' },
  { daysAgo: 2, rupees: 150, category: 'coffee', description: 'Second latte of the week' },
  { daysAgo: 3, rupees: 4200, category: 'bills', description: 'Electricity bill' },
  { daysAgo: 4, rupees: 649, category: 'subscriptions', description: 'Video streaming' },
  { daysAgo: 5, rupees: 1850, category: 'food', description: 'Friends dinner' },
  { daysAgo: 6, rupees: 599, category: 'fun', description: 'Arcade night' },
  { daysAgo: 8, rupees: 2200, category: 'shopping', description: 'Kitchen gadgets' },
  { daysAgo: 10, rupees: 1800, category: 'health', description: 'Gym membership' },
  { daysAgo: 12, rupees: 620, category: 'transport', description: 'Metro pass top-up' },
];

const STORAGE_SAMPLE_PREFIX = 'Sample: ';

function emptyMonsters(): Record<MonsterId, MonsterProgress> {
  return Object.fromEntries(MONSTER_IDS.map((id) => [id, { xp: 0, unlockedAt: null }])) as Record<
    MonsterId,
    MonsterProgress
  >;
}

function dateInCurrentMonth(now: Date, daysAgo: number): string {
  const day = Math.max(1, now.getDate() - daysAgo);
  return dateKey(new Date(now.getFullYear(), now.getMonth(), day));
}

export function createEmptyState(now: Date): GameState {
  return finalizeState(
    {
      monthlyBudgetPaise: null,
      categoryBudgetsPaise: {},
      expenses: [],
      monsters: emptyMonsters(),
      featuredMonsterId: 'shopzilla',
      quests: {},
      achievements: {},
      events: [],
      wishlist: [],
      claimedRewards: {},
    },
    now.toISOString(),
  );
}

export function createDemoState(now: Date): GameState {
  const at = now.toISOString();
  const expenses: Expense[] = SAMPLE_ENTRIES.map((entry, index) => ({
    id: `sample-${index + 1}`,
    amountPaise: entry.rupees * 100,
    category: entry.category,
    date: dateInCurrentMonth(now, entry.daysAgo),
    description: `${STORAGE_SAMPLE_PREFIX}${entry.description}`,
    isSample: true,
    createdAt: new Date(now.getTime() - (index + 1) * 60_000).toISOString(),
  }));

  const monsters = expenses.reduce(
    (acc, expense) => applyExpenseXp(acc, expense.category),
    emptyMonsters(),
  );

  const events = SAMPLE_ENTRIES.filter((entry) => entry.daysAgo <= 2).map((entry) => ({
    type: 'expense_logged' as const,
    at: new Date(now.getTime() - entry.daysAgo * 86_400_000).toISOString(),
    category: entry.category,
  }));

  return finalizeState(
    {
      monthlyBudgetPaise: SAMPLE_MONTHLY_BUDGET_PAISE,
      categoryBudgetsPaise: SAMPLE_CATEGORY_BUDGETS,
      expenses,
      monsters,
      featuredMonsterId: 'coffeeling',
      quests: {},
      achievements: {},
      events,
      wishlist: [],
      claimedRewards: {},
    },
    at,
  );
}
