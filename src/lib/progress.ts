import { ACHIEVEMENTS } from '@/lib/achievements';
import { MONSTER_IDS, MONSTER_SPECIES, getLevelProgress } from '@/lib/monsters';
import { QUESTS, countQuestProgress, questRecordKey } from '@/lib/quests';
import { dateKeyOf, shiftDateKey } from '@/lib/dates';
import type { GameEvent, GameState, PlayerStats } from '@/types';

export function computeStreak(events: GameEvent[], todayKey: string): number {
  const activeDays = new Set(events.map((event) => dateKeyOf(event.at)));
  let cursor = activeDays.has(todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function recentActivityDays(events: GameEvent[], todayKey: string, days: number): { key: string; active: boolean }[] {
  const activeDays = new Set(events.map((event) => dateKeyOf(event.at)));
  return Array.from({ length: days }, (_, index) => {
    const key = shiftDateKey(todayKey, index - (days - 1));
    return { key, active: activeDays.has(key) };
  });
}

export function computeStats(state: GameState, todayKey: string): PlayerStats {
  const events = state.events;
  const countEvents = (type: GameEvent['type']) => events.filter((event) => event.type === type).length;

  return {
    expenseCount: state.expenses.length,
    questsCompleted: countEvents('quest_completed'),
    budgetSet: state.monthlyBudgetPaise !== null,
    simulations: countEvents('simulation'),
    cartsAbandoned: countEvents('cart_abandoned'),
    purchasesCompleted: countEvents('purchase_completed'),
    purchasesSkipped: countEvents('purchase_skipped'),
    unlockedMonsters: MONSTER_IDS.filter((id) => state.monsters[id].unlockedAt !== null).length,
    totalMonsters: MONSTER_IDS.length,
    highestStage: Math.max(...MONSTER_IDS.map((id) => getLevelProgress(state.monsters[id].xp).stage)),
    streak: computeStreak(events, todayKey),
  };
}

export function finalizeState(state: GameState, at: string): GameState {
  const todayKey = dateKeyOf(at);

  const currentQuestKeys = new Set(QUESTS.map((quest) => questRecordKey(quest.id, quest.period, todayKey)));
  const quests = Object.fromEntries(
    Object.entries(state.quests).filter(([key]) => currentQuestKeys.has(key)),
  );

  const statsBeforeUnlock = computeStats({ ...state, quests }, todayKey);
  const monsters = { ...state.monsters };
  for (const species of MONSTER_SPECIES) {
    if (monsters[species.id].unlockedAt === null && species.isUnlocked(statsBeforeUnlock)) {
      monsters[species.id] = { ...monsters[species.id], unlockedAt: at };
    }
  }

  const withUnlocks: GameState = { ...state, quests, monsters };
  const stats = computeStats(withUnlocks, todayKey);
  const achievements = { ...state.achievements };
  for (const achievement of ACHIEVEMENTS) {
    if (!achievements[achievement.id] && achievement.check(stats)) {
      achievements[achievement.id] = at;
    }
  }

  return { ...withUnlocks, achievements };
}

export function questProgressFor(state: GameState, questId: string, todayKey: string) {
  const quest = QUESTS.find((entry) => entry.id === questId);
  if (!quest) return null;
  return {
    quest,
    progress: countQuestProgress(quest, state.events, todayKey),
    record: state.quests[questRecordKey(quest.id, quest.period, todayKey)] ?? null,
  };
}
