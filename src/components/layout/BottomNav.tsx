import { motion } from 'framer-motion';
import { FlaskConical, LayoutDashboard, MessageCircle, PawPrint, PiggyBank, Receipt, Scroll, ShoppingBag, Vault, type LucideIcon } from 'lucide-react';

export type PageId = 'dashboard' | 'expenses' | 'goals' | 'monsters' | 'quests' | 'lab' | 'shop' | 'vault' | 'roast';

const NAV_ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'expenses', label: 'Spend', icon: Receipt },
  { id: 'goals', label: 'Save to Level', icon: PiggyBank },
  { id: 'quests', label: 'Quests', icon: Scroll },
  { id: 'monsters', label: 'Monsters', icon: PawPrint },
  { id: 'lab', label: 'Money Lab', icon: FlaskConical },
  { id: 'shop', label: 'Marketplace', icon: ShoppingBag },
  { id: 'vault', label: 'Vault', icon: Vault },
  { id: 'roast', label: 'Roast', icon: MessageCircle },
];

interface BottomNavProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
}

export function BottomNav({ page, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Main"
      className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-fit -translate-x-1/2 rounded-2xl border border-neon-400/25 bg-night-900/90 p-1.5 shadow-card backdrop-blur-xl"
    >
      <ul className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const active = item.id === page;
          const Icon = item.icon;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
                className={`relative flex h-12 items-center justify-center gap-2 rounded-xl transition duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-400 ${
                  active ? 'px-4 text-night-950' : 'w-12 text-ink-300 hover:bg-white/5 hover:text-ink-50'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="dock-active"
                    className="absolute inset-0 rounded-xl bg-neon-500 shadow-glow-neon"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative h-5 w-5" aria-hidden="true" />
                {active && <span className="relative whitespace-nowrap text-sm font-bold">{item.label}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
