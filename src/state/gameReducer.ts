import { applyExpenseXp } from '@/lib/monsters';
import { dateKeyOf } from '@/lib/dates';
import { finalizeState } from '@/lib/progress';
import { QUEST_BY_ID, countQuestProgress, questRecordKey } from '@/lib/quests';
import { SAMPLE_CATEGORY_BUDGETS, SAMPLE_MONTHLY_BUDGET_PAISE, createDemoState, createEmptyState } from '@/lib/sampleData';
import type { Category } from '@/lib/categories';
import type { EventType, Expense, GameEvent, GameState, MonsterId } from '@/types';

const MAX_EVENTS = 1000;

/** One server record (milestone reward or verified contribution) whose XP is applied once. */
export interface RewardClaim {
  id: string;
  xp: number;
  kind: 'milestone' | 'contribution';
}

export type GameAction = { at: string } & (
  | { type: 'addExpense'; expense: Expense }
  | { type: 'updateExpense'; id: string; patch: Pick<Expense, 'amountPaise' | 'category' | 'date' | 'description'> }
  | { type: 'deleteExpense'; id: string }
  | {
      type: 'saveBudgets';
      monthlyBudgetPaise: number | null;
      categoryBudgetsPaise: Partial<Record<Category, number>>;
    }
  | { type: 'recordEvent'; eventType: Exclude<EventType, 'expense_logged' | 'quest_completed' | 'milestone_reached'> }
  | { type: 'saveForLater'; itemIds: string[] }
  | { type: 'removeFromWishlist'; itemId: string }
  | { type: 'claimRewards'; rewards: RewardClaim[] }
  | { type: 'startQuest'; questId: string }
  | { type: 'claimQuest'; questId: string }
  | { type: 'setFeatured'; monsterId: MonsterId }
  | { type: 'resetDemo' }
  | { type: 'clearSampleData' }
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

    case 'saveForLater': {
      const wishlist = [...new Set([...state.wishlist, ...action.itemIds])].slice(0, 50);
      return finalizeState(
        { ...state, wishlist, events: appendEvent(state.events, { type: 'purchase_reconsidered', at }) },
        at,
      );
    }

    case 'removeFromWishlist':
      return { ...state, wishlist: state.wishlist.filter((id) => id !== action.itemId) };

    case 'claimRewards': {
      // Each server record id is applied once; repeats are ignored.
      const fresh = action.rewards.filter((reward) => !state.claimedRewards[reward.id]);
      if (fresh.length === 0) return state;
      const claimedRewards = { ...state.claimedRewards };
      let events = state.events;
      let xp = 0;
      for (const reward of fresh) {
        claimedRewards[reward.id] = at;
        xp += Math.max(0, Math.floor(reward.xp));
        events = appendEvent(events, { type: reward.kind === 'milestone' ? 'milestone_reached' : 'goal_contribution', at });
      }
      const saverion = state.monsters.saverion;
      return finalizeState(
        { ...state, claimedRewards, events, monsters: { ...state.monsters, saverion: { ...saverion, xp: saverion.xp + xp } } },
        at,
      );
    }

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

    // Resets keep claimedRewards so server-granted XP can never be applied twice.
    case 'resetDemo':
      return finalizeState({ ...createDemoState(new Date(at)), claimedRewards: state.claimedRewards }, at);

    case 'clearSampleData': {
      const sampleBudget =
        state.monthlyBudgetPaise === SAMPLE_MONTHLY_BUDGET_PAISE &&
        JSON.stringify(state.categoryBudgetsPaise) === JSON.stringify(SAMPLE_CATEGORY_BUDGETS);
      return finalizeState(
        {
          ...state,
          expenses: state.expenses.filter((expense) => !expense.isSample),
          monthlyBudgetPaise: sampleBudget ? null : state.monthlyBudgetPaise,
          categoryBudgetsPaise: sampleBudget ? {} : state.categoryBudgetsPaise,
        },
        at,
      );
    }

    case 'clearAll':
      return finalizeState({ ...createEmptyState(new Date(at)), claimedRewards: state.claimedRewards }, at);
  }
}
