import { Coffee, Footprints, Gem, Headphones, Shirt, Sparkles, type LucideIcon } from 'lucide-react';

export interface LootItem {
  id: string;
  name: string;
  blurb: string;
  priceUsdCents: number;
  icon: LucideIcon;
}

export const LOOT_CATALOGUE: LootItem[] = [
  { id: 'neon-hoodie', name: 'Neon Hoodie', blurb: 'Glows faintly in your imagination.', priceUsdCents: 2499, icon: Shirt },
  { id: 'glow-sneakers', name: 'Glow Sneakers', blurb: 'Sole-ly for dramatic entrances.', priceUsdCents: 3499, icon: Footprints },
  { id: 'cold-brew-voucher', name: 'Cold Brew Voucher', blurb: 'One fancy drink, zero regrets (sample).', priceUsdCents: 499, icon: Coffee },
  { id: 'chaos-headphones', name: 'Chaos Headphones', blurb: 'Noise-cancelling for your inner voice.', priceUsdCents: 2999, icon: Headphones },
  { id: 'crystal-sticker-pack', name: 'Crystal Sticker Pack', blurb: 'Decorate your laptop like Saverion.', priceUsdCents: 299, icon: Gem },
  { id: 'monster-plushie', name: 'Monster Plushie', blurb: 'Soft, squishy, and never asks for money.', priceUsdCents: 899, icon: Sparkles },
];

export const LOOT_BY_ID: Record<string, LootItem> = Object.fromEntries(LOOT_CATALOGUE.map((item) => [item.id, item]));
