import type { Category } from '@/lib/categories';
import type { MonsterId, MonsterProgress, PlayerStats } from '@/types';

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic';
export type Stage = 1 | 2 | 3;

export interface MonsterSpecies {
  id: MonsterId;
  name: string;
  rarity: Rarity;
  personality: string;
  category: Category;
  color: string;
  stageNames: [string, string, string];
  unlockText: string;
  isUnlocked: (stats: PlayerStats) => boolean;
}

export const MONSTER_SPECIES: MonsterSpecies[] = [
  {
    id: 'shopzilla',
    name: 'Shopzilla',
    rarity: 'Uncommon',
    personality: 'A mischievous shopping goblin who insists every cart item is a "necessity".',
    category: 'shopping',
    color: '#ff9f43',
    stageNames: ['Shopling', 'Shopzilla', 'Mega Shopzilla'],
    unlockText: 'Starter monster',
    isUnlocked: () => true,
  },
  {
    id: 'coffeeling',
    name: 'Coffeeling',
    rarity: 'Common',
    personality: 'A hyperactive coffee gremlin running on oat milk and bad decisions.',
    category: 'coffee',
    color: '#d19a66',
    stageNames: ['Sip Sprite', 'Coffeeling', 'Espresso Titan'],
    unlockText: 'Log 3 expenses',
    isUnlocked: (stats) => stats.expenseCount >= 3,
  },
  {
    id: 'munchlord',
    name: 'Munchlord',
    rarity: 'Common',
    personality: 'A dramatic food monster who treats every delivery order like a royal feast.',
    category: 'food',
    color: '#ff7b54',
    stageNames: ['Snackling', 'Munchlord', 'Feast Emperor'],
    unlockText: 'Complete 1 quest',
    isUnlocked: (stats) => stats.questsCompleted >= 1,
  },
  {
    id: 'saverion',
    name: 'Saverion',
    rarity: 'Epic',
    personality: 'A cute crystal dragon who hoards savings and glows brighter with every budget kept.',
    category: 'savings',
    color: '#33f58b',
    stageNames: ['Crystalet', 'Saverion', 'Vault Wyrm'],
    unlockText: 'Set a monthly budget',
    isUnlocked: (stats) => stats.budgetSet,
  },
  {
    id: 'napcoin',
    name: 'Napcoin',
    rarity: 'Uncommon',
    personality: 'A sleepy coin-hoarder who forgets subscriptions exist until they bill again.',
    category: 'subscriptions',
    color: '#ffc54d',
    stageNames: ['Coinlet', 'Napcoin', 'Hoard Slumber'],
    unlockText: 'Run 2 Money Lab simulations',
    isUnlocked: (stats) => stats.simulations >= 2,
  },
  {
    id: 'impulso',
    name: 'Impulso',
    rarity: 'Rare',
    personality: 'A chaotic neon slime who bounces toward every "just one more" button.',
    category: 'fun',
    color: '#d78bff',
    stageNames: ['Blorp', 'Impulso', 'Chaos Sovereign'],
    unlockText: 'Abandon a cart on purpose',
    isUnlocked: (stats) => stats.cartsAbandoned >= 1,
  },
];

export const MONSTER_IDS = MONSTER_SPECIES.map((species) => species.id);

export const XP_PER_EXPENSE = 10;
export const MAX_LEVEL = 30;

export function getSpecies(id: MonsterId): MonsterSpecies {
  const species = MONSTER_SPECIES.find((entry) => entry.id === id);
  if (!species) throw new Error(`Unknown monster: ${id}`);
  return species;
}

export function monsterForCategory(category: Category): MonsterSpecies | null {
  return MONSTER_SPECIES.find((species) => species.category === category) ?? null;
}

export function applyExpenseXp(
  monsters: Record<MonsterId, MonsterProgress>,
  category: Category,
): Record<MonsterId, MonsterProgress> {
  const species = monsterForCategory(category);
  if (!species) return monsters;
  const current = monsters[species.id];
  return { ...monsters, [species.id]: { ...current, xp: current.xp + XP_PER_EXPENSE } };
}

export function cumulativeXpForLevel(level: number): number {
  return 40 * (level - 1) + 5 * (level - 1) * level;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= cumulativeXpForLevel(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
  isMaxLevel: boolean;
  stage: Stage;
}

export function getLevelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const isMaxLevel = level >= MAX_LEVEL;
  const floor = cumulativeXpForLevel(level);
  const ceiling = cumulativeXpForLevel(level + 1);
  const xpIntoLevel = xp - floor;
  const xpForNextLevel = ceiling - floor;
  return {
    level,
    xpIntoLevel: isMaxLevel ? xpForNextLevel : xpIntoLevel,
    xpForNextLevel,
    percent: isMaxLevel ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)),
    isMaxLevel,
    stage: stageFromLevel(level),
  };
}

export const STAGE_START_LEVELS: Record<Stage, number> = { 1: 1, 2: 10, 3: 20 };

export function stageFromLevel(level: number): Stage {
  if (level >= STAGE_START_LEVELS[3]) return 3;
  if (level >= STAGE_START_LEVELS[2]) return 2;
  return 1;
}

export function stageName(id: MonsterId, stage: Stage): string {
  return getSpecies(id).stageNames[stage - 1];
}
