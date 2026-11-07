import { dateKeyOf, startOfWeekKey } from '@/lib/dates';
import type { GameEvent, EventType, MonsterId } from '@/types';
import type { Category } from '@/lib/categories';

export type QuestPeriod = 'daily' | 'weekly';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestDefinition {
  id: string;
  name: string;
  period: QuestPeriod;
  difficulty: QuestDifficulty;
  description: string;
  rule: string;
  goal: { event: EventType; count: number; category?: Category };
  rewardMonster: MonsterId;
  rewardXp: number;
}

export const QUESTS: QuestDefinition[] = [
  {
    id: 'forbidden-scroll',
    difficulty: 'easy',
    name: 'The Forbidden Scroll of Checkout',
    period: 'daily',
    description: 'Before a non-essential buy, run it through the Money Lab. The scroll reveals what it really costs.',
    rule: 'Run 1 Money Lab simulation today.',
    goal: { event: 'simulation', count: 1 },
    rewardMonster: 'impulso',
    rewardXp: 40,
  },
  {
    id: 'cart-abandoned',
    difficulty: 'medium',
    name: 'Cart Abandoned Successfully',
    period: 'daily',
    description: 'Fill a cart in the Loot Shop, then walk away from it. Restraint is a skill.',
    rule: 'Leave 1 cart behind in the Loot Shop today.',
    goal: { event: 'cart_abandoned', count: 1 },
    rewardMonster: 'shopzilla',
    rewardXp: 40,
  },
  {
    id: 'receipt-ritual',
    difficulty: 'easy',
    name: 'Morning Receipt Ritual',
    period: 'daily',
    description: 'Log at least one expense today, even a tiny one. Tracking is the whole game.',
    rule: 'Log 1 expense today.',
    goal: { event: 'expense_logged', count: 1 },
    rewardMonster: 'coffeeling',
    rewardXp: 30,
  },
  {
    id: 'subscription-hunt',
    difficulty: 'medium',
    name: 'The Great Subscription Hunt',
    period: 'weekly',
    description: 'Log at least 2 subscription expenses this week so nothing sneaks past you.',
    rule: 'Log 2 subscription expenses this week (Monday to today).',
    goal: { event: 'expense_logged', count: 2, category: 'subscriptions' },
    rewardMonster: 'napcoin',
    rewardXp: 80,
  },
  {
    id: 'budget-boss',
    difficulty: 'hard',
    name: 'The Budget Boss Fight',
    period: 'weekly',
    description: 'Every logged expense deals damage to the boss. Honest logging counts, even for snacks.',
    rule: 'Log 5 expenses this week (Monday to today).',
    goal: { event: 'expense_logged', count: 5 },
    rewardMonster: 'saverion',
    rewardXp: 80,
  },
  {
    id: 'frugal-side',
    difficulty: 'medium',
    name: 'The Frugal Side Quest',
    period: 'weekly',
    description: 'Talk yourself out of one tempting purchase using the "Skip it" option in the Money Lab.',
    rule: 'Skip 1 purchase in the Money Lab this week.',
    goal: { event: 'purchase_skipped', count: 1 },
    rewardMonster: 'saverion',
    rewardXp: 60,
  },
  {
    id: 'second-thought',
    difficulty: 'easy',
    name: 'The Second Thought',
    period: 'daily',
    description: 'When the Purchase Guardian checks an item, choose "Save for later" instead of buying right away.',
    rule: 'Save 1 marketplace item for later today.',
    goal: { event: 'purchase_reconsidered', count: 1 },
    rewardMonster: 'impulso',
    rewardXp: 35,
  },
  {
    id: 'ledger-review',
    difficulty: 'easy',
    name: 'Ledger Lookout',
    period: 'daily',
    description: 'Open your AI insights on the dashboard and mark your spending as reviewed.',
    rule: 'Review your spending 1 time today.',
    goal: { event: 'spending_reviewed', count: 1 },
    rewardMonster: 'napcoin',
    rewardXp: 30,
  },
  {
    id: 'paypal-saver',
    difficulty: 'medium',
    name: 'Feed the Piggy Golem',
    period: 'weekly',
    description: 'Make one savings goal contribution through PayPal Sandbox. It only counts once PayPal confirms it.',
    rule: 'Make 1 verified goal contribution this week.',
    goal: { event: 'goal_contribution', count: 1 },
    rewardMonster: 'saverion',
    rewardXp: 100,
  },
  {
    id: 'milestone-hunter',
    difficulty: 'hard',
    name: 'Milestone Hunter',
    period: 'weekly',
    description: 'Push a savings goal past its next milestone (25%, 50%, 75% or 100%).',
    rule: 'Reach 1 verified savings milestone this week.',
    goal: { event: 'milestone_reached', count: 1 },
    rewardMonster: 'saverion',
    rewardXp: 150,
  },
];

export const QUEST_BY_ID: Record<string, QuestDefinition> = Object.fromEntries(
  QUESTS.map((quest) => [quest.id, quest]),
);

export function periodStartKey(period: QuestPeriod, todayKey: string): string {
  return period === 'daily' ? todayKey : startOfWeekKey(todayKey);
}

export function questRecordKey(questId: string, period: QuestPeriod, todayKey: string): string {
  return `${questId}:${periodStartKey(period, todayKey)}`;
}

export function countQuestProgress(quest: QuestDefinition, events: GameEvent[], todayKey: string): number {
  const startKey = periodStartKey(quest.period, todayKey);
  return events.filter((event) => {
    if (event.type !== quest.goal.event) return false;
    if (quest.goal.category && event.category !== quest.goal.category) return false;
    return dateKeyOf(event.at) >= startKey;
  }).length;
}
