import type { LucideIcon } from 'lucide-react';
import { Crown, FlaskConical, Flame, Ghost, PiggyBank, Receipt, ScrollText, ShoppingBag, Sparkles, Swords } from 'lucide-react';
import type { PlayerStats } from '@/types';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  check: (stats: PlayerStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-receipt',
    title: 'First Receipt',
    description: 'Log your first expense.',
    icon: Receipt,
    check: (s) => s.expenseCount >= 1,
  },
  {
    id: 'budget-keeper',
    title: 'Budget Keeper',
    description: 'Set a monthly budget.',
    icon: PiggyBank,
    check: (s) => s.budgetSet,
  },
  {
    id: 'scroll-reader',
    title: 'Scroll Reader',
    description: 'Complete your first quest.',
    icon: ScrollText,
    check: (s) => s.questsCompleted >= 1,
  },
  {
    id: 'on-a-roll',
    title: 'On a Roll',
    description: 'Stay active 3 days in a row.',
    icon: Flame,
    check: (s) => s.streak >= 3,
  },
  {
    id: 'lab-rat',
    title: 'Lab Rat',
    description: 'Run 3 Money Lab simulations.',
    icon: FlaskConical,
    check: (s) => s.simulations >= 3,
  },
  {
    id: 'evolution-watch',
    title: 'Evolution Watch',
    description: 'Evolve a monster to stage 2.',
    icon: Sparkles,
    check: (s) => s.highestStage >= 2,
  },
  {
    id: 'monster-trainer',
    title: 'Monster Trainer',
    description: 'Unlock 3 monsters.',
    icon: Swords,
    check: (s) => s.unlockedMonsters >= 3,
  },
  {
    id: 'full-collection',
    title: 'Full Collection',
    description: 'Unlock every starter monster.',
    icon: Crown,
    check: (s) => s.unlockedMonsters >= s.totalMonsters,
  },
  {
    id: 'cart-ghost',
    title: 'Cart Ghost',
    description: 'Abandon a cart on purpose.',
    icon: Ghost,
    check: (s) => s.cartsAbandoned >= 1,
  },
  {
    id: 'first-loot',
    title: 'First Loot',
    description: 'Complete your first Loot Shop checkout.',
    icon: ShoppingBag,
    check: (s) => s.purchasesCompleted >= 1,
  },
];
