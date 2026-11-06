import { Bus, Coffee, CircleDot, HeartPulse, PartyPopper, PiggyBank, Receipt, Repeat, ShoppingBag, Utensils, type LucideIcon } from 'lucide-react';
import type { Category } from '@/lib/categories';

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  food: Utensils,
  coffee: Coffee,
  shopping: ShoppingBag,
  subscriptions: Repeat,
  fun: PartyPopper,
  transport: Bus,
  bills: Receipt,
  health: HeartPulse,
  savings: PiggyBank,
  other: CircleDot,
};

export function categoryIcon(category: Category): LucideIcon {
  return CATEGORY_ICONS[category];
}
