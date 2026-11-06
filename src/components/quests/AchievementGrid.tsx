import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { dateKeyOf, formatDayLabel } from '@/lib/dates';
import { cn } from '@/lib/cn';

interface AchievementGridProps {
  unlocked: Record<string, string>;
}

export function AchievementGrid({ unlocked }: AchievementGridProps) {
  const count = ACHIEVEMENTS.filter((achievement) => unlocked[achievement.id]).length;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-300">
        {count} of {ACHIEVEMENTS.length} unlocked. Achievements come from play, never from spending amounts.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ACHIEVEMENTS.map((achievement, index) => {
          const unlockedAt = unlocked[achievement.id];
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                'flex items-start gap-3 rounded-2xl border p-4',
                unlockedAt ? 'border-neon-400/30 bg-neon-500/5' : 'border-white/10 bg-night-950/40 opacity-70',
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  unlockedAt ? 'bg-neon-500/20 text-neon-300' : 'bg-white/5 text-ink-400',
                )}
              >
                {unlockedAt ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink-50">{achievement.title}</p>
                <p className="text-xs text-ink-300">{achievement.description}</p>
                {unlockedAt && (
                  <p className="mt-1 text-[11px] font-medium text-neon-300">Unlocked {formatDayLabel(dateKeyOf(unlockedAt))}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
