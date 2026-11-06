import { applyExpenseXp } from '@/lib/monsters';
import { dateKeyOf } from '@/lib/dates';
import { finalizeState } from '@/lib/progress';
import { QUEST_BY_ID, countQuestProgress, questRecordKey } from '@/lib/quests';
import { createDemoState, createEmptyState } from '@/lib/sampleData';
import type { Category } from '@/lib/categories';
import type { EventType, Expense, GameEvent, GameState, MonsterId } from '@/types';

const MAX_EVENTS = 1000;

export type GameAction = { at: string } & (
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: Pick<Expense, 'amountPaise' | 'category' | 'date' | 'description'> }
  | { type: 'deleteExpense'; id: string }
  | {
      type: 'saveBudgets';
      monthlyBudgetPaise: number | null;
      categoryBudgetsPaise: Partial<Record<Category, number>>;
    }
  | { type: 'recordEvent'; eventType: Exclude<EventType, 'expense_logged' | 'quest_completed'> }
  | { type: 'startQuest'; questId: string }
  | { type: 'claimQuest'; questId: string }
  | { type: 'setFeatured'; monsterId: MonsterId }
  | { type: 'resetDemo' }
  | { type: 'clearAll' }
);

function appendEvent(events: GameEvent[], event: GameEvent): GameEvent[] {
  return [...events, event].slice(-MAX_EVENTS);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const { at } = action;

  switch (action.type) {
    case 'addExpense':
      return finalizeState(
        {
          ...state,
          expenses: [action.expense, ...state.expenses],
          monsters: applyExpenseXp(state.monsters, action.expense.category),
          events: appendEvent(state.events, { type: 'expense_logged', at, category: action.expense.category }),
        },
        at,
      );

    case 'updateExpense':
      return finalizeState(
        {
          ...state,
          expenses: state.expenses.map((expense) =>
            expense.id === action.id ? { ...expense, ...action.patch } : expense,
          ),
        },
        at,
      );

    case 'deleteExpense':
      return finalizeState(
        { ...state, expenses: state.expenses.filter((expense) => expense.id !== action.id) },
        at,
      );

    case 'saveBudgets':
      return finalizeState(
        {
          ...state,
          monthlyBudgetPaise: action.monthlyBudgetPaise,
          categoryBudgetsPaise: action.categoryBudgetsPaise,
        },
        at,
      );

    case 'recordEvent':
      return finalizeState({ ...state, events: appendEvent(state.events, { type: action.eventType, at }) }, at);

    case 'startQuest': {
      const quest = QUEST_BY_ID[action.questId];
      if (!quest) return state;
      const key = questRecordKey(quest.id, quest.period, dateKeyOf(at));
      if (state.quests[key]) return state;
      return finalizeState(
        {
          ...state,
          quests: { ...state.quests, [key]: { status: 'active', startedAt: at, completedAt: null } },
        },
        at,
      );
    }

    case 'claimQuest': {
      const quest = QUEST_BY_ID[action.questId];
      if (!quest) return state;
      const today = dateKeyOf(at);
      const key = questRecordKey(quest.id, quest.period, today);
      const record = state.quests[key];
      if (record?.status !== 'active') return state;
      if (countQuestProgress(quest, state.events, today) < quest.goal.count) return state;

      const reward = state.monsters[quest.rewardMonster];
      return finalizeState(
        {
          ...state,
          monsters: { ...state.monsters, [quest.rewardMonster]: { ...reward, xp: reward.xp + quest.rewardXp } },
          quests: { ...state.quests, [key]: { ...record, status: 'completed', completedAt: at } },
          events: appendEvent(state.events, { type: 'quest_completed', at }),
        },
        at,
      );
    }

    case 'setFeatured':
      return { ...state, featuredMonsterId: action.monsterId };

    case 'resetDemo':
      return finalizeState(createDemoState(new Date(at)), at);

    case 'clearAll':
      return finalizeState(createEmptyState(new Date(at)), at);
  }
}
