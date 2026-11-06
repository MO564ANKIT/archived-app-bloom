import type { PageId } from '@/components/layout/BottomNav';

export const PAGE_PATHS = {
  dashboard: '/',
  expenses: '/expenses',
  goals: '/goals',
  monsters: '/monsters',
  quests: '/quests',
  lab: '/money-lab',
  shop: '/loot-shop',
  vault: '/vault',
  roast: '/roast',
} as const satisfies Record<PageId, string>;

export function pageFromPath(pathname: string): PageId {
  const entry = (Object.entries(PAGE_PATHS) as [PageId, string][]).find(([, path]) => path === pathname);
  return entry ? entry[0] : 'dashboard';
}
