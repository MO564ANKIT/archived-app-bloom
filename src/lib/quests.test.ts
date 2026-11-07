import { describe, expect, it } from 'vitest';
import { countQuestProgress, QUESTS } from '@/lib/quests';
import type { GameEvent } from '@/types';

const TODAY = '2025-06-15';
const scroll = QUESTS.find((quest) => quest.id === 'forbidden-scroll');
if (!scroll) throw new Error('forbidden-scroll quest is missing');

describe('countQuestProgress', () => {
  it('counts only events from the current day for a daily quest', () => {
    const events: GameEvent[] = [
      { type: 'simulation', at: `${TODAY}T08:00:00.000Z` },
      { type: 'simulation', at: '2025-06-14T08:00:00.000Z' },
      { type: 'expense_logged', at: `${TODAY}T09:00:00.000Z` },
    ];
    expect(countQuestProgress(scroll, events, TODAY)).toBe(1);
  });

  it('filters by category when the quest asks for one', () => {
    const categoryQuest = { ...scroll, goal: { event: 'expense_logged' as const, count: 1, category: 'coffee' as const } };
    const events: GameEvent[] = [
      { type: 'expense_logged', at: `${TODAY}T09:00:00.000Z`, category: 'food' },
      { type: 'expense_logged', at: `${TODAY}T10:00:00.000Z`, category: 'coffee' },
    ];
    expect(countQuestProgress(categoryQuest, events, TODAY)).toBe(1);
  });
});

describe('savings quests', () => {
  const saver = QUESTS.find((quest) => quest.id === 'paypal-saver');
  const hunter = QUESTS.find((quest) => quest.id === 'milestone-hunter');
  if (!saver || !hunter) throw new Error('savings quests are missing');

  it('counts only verified goal contributions from this week', () => {
    const events: GameEvent[] = [
      { type: 'goal_contribution', at: `${TODAY}T08:00:00.000Z` },
      { type: 'goal_contribution', at: '2025-06-01T08:00:00.000Z' },
      { type: 'purchase_completed', at: `${TODAY}T09:00:00.000Z` },
    ];
    expect(countQuestProgress(saver, events, TODAY)).toBe(1);
  });

  it('milestone hunter is a hard weekly quest needing one milestone', () => {
    expect(hunter.period).toBe('weekly');
    expect(hunter.difficulty).toBe('hard');
    expect(hunter.goal).toEqual({ event: 'milestone_reached', count: 1 });
  });
});
