import { Crown, Flame, Gem, Glasses, Grid3x3, Lamp, Medal, Shirt, Sparkles, Star, Vault, Zap, type LucideIcon } from 'lucide-react';
import type { MonsterId } from '@/types';

export type ItemType = 'skin' | 'accessory' | 'effect' | 'background' | 'collection' | 'seasonal';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface LootItem {
  id: string;
  name: string;
  blurb: string;
  /** Display price only; the server catalogue decides what is charged. 0 for earn-only rewards. */
  priceUsdCents: number;
  type: ItemType;
  rarity: Rarity;
  icon: LucideIcon;
  /** Monster shown in the preview tile. */
  previewMonster: MonsterId;
  /** Semantic token classes for the preview tile. */
  previewClass: string;
  /** Earned from savings milestones; cannot be bought. */
  earnOnly?: boolean;
}

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  skin: 'Monster skin',
  accessory: 'Accessory',
  effect: 'Evolution effect',
  background: 'Background',
  collection: 'Rare collection',
  seasonal: 'Seasonal',
};

export const RARITY_CLASS: Record<Rarity, string> = {
  common: 'bg-white/10 text-ink-200',
  uncommon: 'bg-aqua-500/15 text-aqua-300',
  rare: 'bg-volt-500/20 text-volt-300',
  epic: 'bg-rose-500/15 text-rose-300',
  legendary: 'bg-amber-500/20 text-amber-300',
};

export const LOOT_CATALOGUE: LootItem[] = [
  { id: 'skin-neon-circuit', name: 'Neon Circuit Skin', blurb: 'Lime circuitry traced over Saverion’s crystal shell.', priceUsdCents: 499, type: 'skin', rarity: 'rare', icon: Shirt, previewMonster: 'saverion', previewClass: 'bg-neon-500/15 ring-neon-400/50' },
  { id: 'skin-midnight-velvet', name: 'Midnight Velvet Skin', blurb: 'A deep violet coat for Impulso’s calmer days.', priceUsdCents: 399, type: 'skin', rarity: 'uncommon', icon: Shirt, previewMonster: 'impulso', previewClass: 'bg-volt-600/25 ring-volt-400/50' },
  { id: 'acc-tiny-crown', name: 'Tiny Gold Crown', blurb: 'For the monster who stayed under budget.', priceUsdCents: 199, type: 'accessory', rarity: 'common', icon: Crown, previewMonster: 'coffeeling', previewClass: 'bg-amber-500/15 ring-amber-400/40' },
  { id: 'acc-cyber-visor', name: 'Cyber Visor', blurb: 'Scans every receipt in a single blink.', priceUsdCents: 249, type: 'accessory', rarity: 'uncommon', icon: Glasses, previewMonster: 'shopzilla', previewClass: 'bg-aqua-500/15 ring-aqua-400/50' },
  { id: 'fx-lime-aura', name: 'Lime Evolution Aura', blurb: 'A pulsing lime glow when your monster levels up.', priceUsdCents: 599, type: 'effect', rarity: 'epic', icon: Zap, previewMonster: 'saverion', previewClass: 'bg-neon-500/20 ring-neon-500/70 shadow-glow-neon' },
  { id: 'fx-cyan-sparks', name: 'Cyan Spark Trail', blurb: 'Leaves a short spark trail on every quest claim.', priceUsdCents: 299, type: 'effect', rarity: 'rare', icon: Sparkles, previewMonster: 'napcoin', previewClass: 'bg-aqua-500/20 ring-aqua-300/60' },
  { id: 'bg-violet-nebula', name: 'Violet Nebula Backdrop', blurb: 'A quiet purple sky behind your featured monster.', priceUsdCents: 199, type: 'background', rarity: 'common', icon: Star, previewMonster: 'munchlord', previewClass: 'bg-volt-500/25 ring-volt-300/40' },
  { id: 'bg-ledger-grid', name: 'Ledger Grid Arena', blurb: 'A glowing grid floor, like a spreadsheet you can stand on.', priceUsdCents: 299, type: 'background', rarity: 'uncommon', icon: Grid3x3, previewMonster: 'shopzilla', previewClass: 'bg-night-600 ring-neon-400/40' },
  { id: 'col-founders-vault', name: 'Founders Vault Collection', blurb: 'Skin, visor and aura themed on the very first Spendemon.', priceUsdCents: 999, type: 'collection', rarity: 'legendary', icon: Vault, previewMonster: 'saverion', previewClass: 'bg-amber-500/20 ring-amber-300/70 shadow-glow-amber' },
  { id: 'season-festival-lanterns', name: 'Festival Lanterns', blurb: 'Seasonal: warm lanterns float around your monster.', priceUsdCents: 349, type: 'seasonal', rarity: 'rare', icon: Lamp, previewMonster: 'coffeeling', previewClass: 'bg-amber-500/15 ring-rose-300/50' },
  // Earned from verified savings milestones only.
  { id: 'reward-goal-medal', name: 'Halfway Medal', blurb: 'Earned at 50% of a savings goal.', priceUsdCents: 0, type: 'accessory', rarity: 'rare', icon: Medal, previewMonster: 'saverion', previewClass: 'bg-volt-500/20 ring-volt-300/60', earnOnly: true },
  { id: 'reward-rare-glow', name: 'Rare Saver Glow', blurb: 'Earned at 75% of a savings goal.', priceUsdCents: 0, type: 'effect', rarity: 'epic', icon: Flame, previewMonster: 'saverion', previewClass: 'bg-aqua-500/20 ring-aqua-300/70', earnOnly: true },
  { id: 'reward-legendary-crest', name: 'Legendary Goal Crest', blurb: 'Earned by completing a savings goal.', priceUsdCents: 0, type: 'collection', rarity: 'legendary', icon: Gem, previewMonster: 'saverion', previewClass: 'bg-amber-500/25 ring-amber-300/80 shadow-glow-amber', earnOnly: true },
];

export const SHOP_ITEMS = LOOT_CATALOGUE.filter((item) => !item.earnOnly);
export const LOOT_BY_ID: Record<string, LootItem> = Object.fromEntries(LOOT_CATALOGUE.map((item) => [item.id, item]));

export const MILESTONE_REWARDS: Record<number, { label: string; xp: number; itemId?: string }> = {
  25: { label: '+50 XP for Saverion', xp: 50 },
  50: { label: 'Halfway Medal accessory + 75 XP', xp: 75, itemId: 'reward-goal-medal' },
  75: { label: 'Rare Saver Glow effect + 100 XP', xp: 100, itemId: 'reward-rare-glow' },
  100: { label: 'Legendary Goal Crest + 200 XP', xp: 200, itemId: 'reward-legendary-crest' },
};
