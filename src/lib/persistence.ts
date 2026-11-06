import { supabase } from '@/lib/supabase';
import { isCategory } from '@/lib/categories';
import { MONSTER_IDS } from '@/lib/monsters';
import { QUESTS } from '@/lib/quests';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { createDemoState } from '@/lib/sampleData';
import type { Category } from '@/lib/categories';
import type { Expense, GameEvent, GameState, MonsterId, MonsterProgress, QuestRecord } from '@/types';

const STORAGE_KEY = 'spendemon.state.v1';
const EVENT_TYPES = [
  'expense_logged',
  'simulation',
  'purchase_skipped',
  'cart_abandoned',
  'purchase_completed',
  'quest_completed',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExpense(value: unknown): value is Expense {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.amountPaise === 'number' &&
    Number.isInteger(value.amountPaise) &&
    value.amountPaise > 0 &&
    isCategory(value.category) &&
    typeof value.date === 'string' &&
    typeof value.description === 'string' &&
    typeof value.isSample === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}

function isEvent(value: unknown): value is GameEvent {
  if (!isRecord(value)) return false;
  return typeof value.type === 'string' && EVENT_TYPES.includes(value.type) && typeof value.at === 'string';
}

function sanitizeMonsters(value: unknown): Record<MonsterId, MonsterProgress> | null {
  if (!isRecord(value)) return null;
  const result = {} as Record<MonsterId, MonsterProgress>;
  for (const id of MONSTER_IDS) {
    const entry = value[id];
    if (!isRecord(entry) || typeof entry.xp !== 'number' || entry.xp < 0) return null;
    const unlockedAt = typeof entry.unlockedAt === 'string' ? entry.unlockedAt : null;
    result[id] = { xp: Math.floor(entry.xp), unlockedAt };
  }
  return result;
}

function sanitizeQuests(value: unknown): Record<string, QuestRecord> | null {
  if (!isRecord(value)) return null;
  const validIds = new Set(QUESTS.map((quest) => quest.id));
  const result: Record<string, QuestRecord> = {};
  for (const [key, entry] of Object.entries(value)) {
    const questId = key.split(':')[0];
    if (!validIds.has(questId) || !isRecord(entry)) continue;
    if ((entry.status !== 'active' && entry.status !== 'completed') || typeof entry.startedAt !== 'string') continue;
    result[key] = {
      status: entry.status,
      startedAt: entry.startedAt,
      completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : null,
    };
  }
  return result;
}

function sanitizeAchievements(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const validIds = new Set(ACHIEVEMENTS.map((achievement) => achievement.id));
  const result: Record<string, string> = {};
  for (const [id, at] of Object.entries(value)) {
    if (validIds.has(id) && typeof at === 'string') result[id] = at;
  }
  return result;
}

function sanitizeBudgets(value: unknown): Partial<Record<Category, number>> | null {
  if (!isRecord(value)) return null;
  const result: Partial<Record<Category, number>> = {};
  for (const [key, amount] of Object.entries(value)) {
    if (!isCategory(key)) continue;
    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) return null;
    result[key] = amount;
  }
  return result;
}

function sanitizeState(value: unknown): GameState | null {
  if (!isRecord(value)) return null;

  const monthly = value.monthlyBudgetPaise;
  const monthlyBudgetPaise =
    monthly === null ? null : typeof monthly === 'number' && Number.isInteger(monthly) && monthly > 0 ? monthly : undefined;
  const categoryBudgetsPaise = sanitizeBudgets(value.categoryBudgetsPaise);
  const monsters = sanitizeMonsters(value.monsters);
  const quests = sanitizeQuests(value.quests);
  const achievements = sanitizeAchievements(value.achievements);

  if (monthlyBudgetPaise === undefined || !categoryBudgetsPaise || !monsters || !quests || !achievements) return null;
  if (!Array.isArray(value.expenses) || !Array.isArray(value.events)) return null;
  if (typeof value.featuredMonsterId !== 'string' || !MONSTER_IDS.includes(value.featuredMonsterId as MonsterId)) {
    return null;
  }

  return {
    monthlyBudgetPaise,
    categoryBudgetsPaise,
    expenses: value.expenses.filter(isExpense),
    monsters,
    featuredMonsterId: value.featuredMonsterId as MonsterId,
    quests,
    achievements,
    events: value.events.filter(isEvent),
  };
}

function readLegacyLocalState(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export interface LoadedPlayerState {
  state: GameState;
  version: number;
}

export class SaveConflictError extends Error {}

export async function loadPlayerState(userId: string, now: Date): Promise<LoadedPlayerState> {
  const { data, error } = await supabase
    .from('player_saves')
    .select('state, version')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Your saved progress could not be loaded. Please try again.');
  if (data) {
    return { state: sanitizeState(data.state) ?? createDemoState(now), version: data.version };
  }
  return { state: readLegacyLocalState() ?? createDemoState(now), version: 0 };
}

export async function savePlayerState(userId: string, state: GameState, version: number): Promise<number> {
  const updatedAt = new Date().toISOString();
  if (version === 0) {
    const { error } = await supabase
      .from('player_saves')
      .insert({ user_id: userId, state, updated_at: updatedAt, version: 1 });
    if (error?.code === '23505') throw new SaveConflictError();
    if (error) throw new Error('Your latest progress could not be saved.');
    return 1;
  }
  const { data, error } = await supabase
    .from('player_saves')
    .update({ state, updated_at: updatedAt, version: version + 1 })
    .eq('user_id', userId)
    .eq('version', version)
    .select('version')
    .maybeSingle();
  if (error) throw new Error('Your latest progress could not be saved.');
  if (!data) throw new SaveConflictError();
  return data.version;
}
