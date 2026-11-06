import { motion } from 'framer-motion';
import { Flame, PawPrint, Receipt, Scroll, ShoppingBag, type LucideIcon } from 'lucide-react';
import type { PageId } from '@/components/layout/BottomNav';

interface ActionDef {
  id: PageId;
  label: string;
  icon: LucideIcon;
  ring: string;
  hover: string;
  text: string;
}

const ACTIONS: ActionDef[] = [
  { id: 'expenses', label: 'Log spend', icon: Receipt, ring: 'border-neon-400', hover: 'group-hover:shadow-glow-neon', text: 'text-neon-300' },
  { id: 'quests', label: 'Quests', icon: Scroll, ring: 'border-amber-400', hover: 'group-hover:shadow-glow-amber', text: 'text-amber-300' },
  { id: 'monsters', label: 'Monsters', icon: PawPrint, ring: 'border-rose-400', hover: 'group-hover:shadow-glow-rose', text: 'text-rose-300' },
  { id: 'shop', label: 'Loot Shop', icon: ShoppingBag, ring: 'border-volt-400', hover: 'group-hover:shadow-glow-volt', text: 'text-volt-300' },
  { id: 'roast', label: 'AI Roast', icon: Flame, ring: 'border-lime-400', hover: 'group-hover:shadow-glow-neon', text: 'text-lime-300' },
];

interface QuickActionsProps {
  onNavigate: (page: PageId) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <ul className="grid grid-cols-5 gap-2 sm:gap-6">
      {ACTIONS.map((action, index) => {
        const Icon = action.icon;
        return (
          <li key={action.id} className="flex justify-center">
            <motion.button
              type="button"
              onClick={() => onNavigate(action.id)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.35 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.92 }}
              className="group flex flex-col items-center gap-2.5 focus-visible:outline-none"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-night-900 transition duration-300 group-focus-visible:ring-2 group-focus-visible:ring-neon-400 sm:h-20 sm:w-20 ${action.ring} ${action.hover} ${action.text}`}
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
              </span>
              <span className="text-center text-[10px] font-bold uppercase tracking-wider text-ink-200 sm:text-xs">
                {action.label}
              </span>
            </motion.button>
          </li>
        );
      })}
    </ul>
  );
}
