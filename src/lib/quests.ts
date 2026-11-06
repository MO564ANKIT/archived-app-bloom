import { dateKeyOf, startOfWeekKey } from '@/lib/dates';
import type { GameEvent, EventType, MonsterId } from '@/types';
import type { Category } from '@/lib/categories';

export type QuestPeriod = 'daily' | 'weekly';

export interface QuestDefinition {
  id: string;
  name: string;
  period: QuestPeriod;
  description: string;
  rule: string;
  goal: { event: EventType; count: number; category?: Category };
  rewardMonster: MonsterId;
  rewardXp: number;
}

export const QUESTS: QuestDefinition[] = [
  {
    id: 'forbidden-scroll',
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
    name: 'The Frugal Side Quest',
    period: 'weekly',
    description: 'Talk yourself out of one tempting purchase using the "Skip it" option in the Money Lab.',
    rule: 'Skip 1 purchase in the Money Lab this week.',
    goal: { event: 'purchase_skipped', count: 1 },
    rewardMonster: 'saverion',
    rewardXp: 60,
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
