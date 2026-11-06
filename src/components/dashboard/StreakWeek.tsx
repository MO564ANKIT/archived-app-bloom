import { Flame } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { parseDateKey } from '@/lib/dates';
import { recentActivityDays } from '@/lib/progress';
import type { GameEvent } from '@/types';

interface StreakWeekProps {
  events: GameEvent[];
  todayKey: string;
  streak: number;
  onLogToday: () => void;
}

export function StreakWeek({ events, todayKey, streak, onLogToday }: StreakWeekProps) {
  const days = recentActivityDays(events, todayKey, 7);
  const loggedToday = days[days.length - 1].active;

  return (
    <section className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
          <Flame className="h-5 w-5 text-amber-300" /> {streak} day streak
        </h2>
        {!loggedToday && (
          <Button variant="primary" size="sm" onClick={onLogToday}>
            Log today
          </Button>
        )}
      </div>
      <ol className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map((day) => (
          <li key={day.key} className="flex flex-col items-center gap-2">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition duration-300 sm:h-14 sm:w-14 ${
                day.active
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-glow-amber'
                  : 'border-white/10 bg-night-950/60 text-ink-500'
              }`}
            >
              <Flame className={day.active ? 'h-5 w-5' : 'h-4 w-4 opacity-40'} aria-hidden="true" />
              <span className="sr-only">{day.active ? 'Logged' : 'Not logged'}</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              {parseDateKey(day.key).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-center text-xs text-ink-400">Log something every day to keep the flame lit.</p>
    </section>
  );
}
