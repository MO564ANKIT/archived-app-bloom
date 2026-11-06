import type { Category } from '@/lib/categories';

export type MonsterId = 'shopzilla' | 'coffeeling' | 'munchlord' | 'saverion' | 'napcoin' | 'impulso';

export type EventType =
  | 'expense_logged'
  | 'simulation'
  | 'purchase_skipped'
  | 'cart_abandoned'
  | 'purchase_completed'
  | 'quest_completed';

export interface Expense {
  id: string;
  amountPaise: number;
  category: Category;
  date: string;
  description: string;
  isSample: boolean;
  createdAt: string;
}

export interface GameEvent {
  type: EventType;
  at: string;
  category?: Category;
}

export interface MonsterProgress {
  xp: number;
  unlockedAt: string | null;
}

export interface QuestRecord {
  status: 'active' | 'completed';
  startedAt: string;
  completedAt: string | null;
}

export interface GameState {
  monthlyBudgetPaise: number | null;
  categoryBudgetsPaise: Partial<Record<Category, number>>;
  expenses: Expense[];
  monsters: Record<MonsterId, MonsterProgress>;
  featuredMonsterId: MonsterId;
  quests: Record<string, QuestRecord>;
  achievements: Record<string, string>;
  events: GameEvent[];
}

export interface PlayerStats {
  expenseCount: number;
  questsCompleted: number;
  budgetSet: boolean;
  simulations: number;
  cartsAbandoned: number;
  purchasesCompleted: number;
  purchasesSkipped: number;
  unlockedMonsters: number;
  totalMonsters: number;
  highestStage: number;
  streak: number;
}
