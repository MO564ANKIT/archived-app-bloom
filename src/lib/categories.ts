export const CATEGORIES = [
  'food',
  'coffee',
  'shopping',
  'subscriptions',
  'fun',
  'transport',
  'bills',
  'health',
  'savings',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

interface CategoryMeta {
  label: string;
  necessity: boolean;
  roastable: boolean;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  food: { label: 'Food & Snacks', necessity: false, roastable: true },
  coffee: { label: 'Coffee & Drinks', necessity: false, roastable: true },
  shopping: { label: 'Shopping', necessity: false, roastable: true },
  subscriptions: { label: 'Subscriptions', necessity: false, roastable: true },
  fun: { label: 'Fun & Games', necessity: false, roastable: true },
  transport: { label: 'Transport', necessity: true, roastable: false },
  bills: { label: 'Bills & Rent', necessity: true, roastable: false },
  health: { label: 'Health', necessity: true, roastable: false },
  savings: { label: 'Savings Transfer', necessity: false, roastable: false },
  other: { label: 'Other', necessity: false, roastable: false },
};

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}
