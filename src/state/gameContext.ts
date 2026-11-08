import { createContext, useContext } from 'react';
import type { Category } from '@/lib/categories';
import type { EventType, GameState, MonsterId } from '@/types';
import type { RewardClaim } from '@/state/gameReducer';

export interface ExpenseInput {
  amountPaise: number;
  category: Category;
  date: string;
  description: string;
}

export type SyncStatus = 'ok' | 'error' | 'conflict';

export interface GameContextValue {
  state: GameState;
  today: string;
  syncStatus: SyncStatus;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  saveBudgets: (monthlyBudgetPaise: number | null, categoryBudgetsPaise: Partial<Record<Category, number>>) => void;
  recordEvent: (eventType: Exclude<EventType, 'expense_logged' | 'quest_completed' | 'milestone_reached'>) => void;
  saveForLater: (itemIds: string[]) => void;
  removeFromWishlist: (itemId: string) => void;
  claimRewards: (rewards: RewardClaim[]) => void;
  startQuest: (questId: string) => void;
  claimQuest: (questId: string) => void;
  setFeatured: (monsterId: MonsterId) => void;
  resetDemo: () => void;
  clearSampleData: () => void;
  clearAll: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}
