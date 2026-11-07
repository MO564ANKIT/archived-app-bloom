import { useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, PawPrint, Scroll, Sparkles, Trophy, Wallet } from 'lucide-react';
import type { PageId } from '@/components/layout/BottomNav';
import { BudgetSummary } from '@/components/budget/BudgetSummary';
import { budgetTone } from '@/components/budget/budgetTone';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentExpenses } from '@/components/dashboard/RecentExpenses';
import { InsightsCard } from '@/components/dashboard/InsightsCard';
import { SavingsOverview } from '@/components/dashboard/SavingsOverview';
import { StreakWeek } from '@/components/dashboard/StreakWeek';
import { MonsterStage } from '@/components/monsters/MonsterStage';
import { Button } from '@/components/kit/Button';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { ProgressRing } from '@/components/kit/ProgressRing';
import { StaggerItem } from '@/components/kit/Stagger';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { formatMoney } from '@/lib/money';
import { formatMonthLabel, daysLeftInMonth, monthKeyOf } from '@/lib/dates';
import { summarizeMonth } from '@/lib/finance';
import { getLevelProgress, getSpecies, stageName } from '@/lib/monsters';
import { computeStreak } from '@/lib/progress';
import { QUESTS, countQuestProgress, questRecordKey } from '@/lib/quests';
import { useCountUp } from '@/lib/useCountUp';
import { useGame } from '@/state/gameContext';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { state, today } = useGame();
  const summary = useMemo(() => summarizeMonth(state, monthKeyOf(today)), [state, today]);
  const featured = getSpecies(state.featuredMonsterId);
  const featuredProgress = getLevelProgress(state.monsters[featured.id].xp);
  const streak = computeStreak(state.events, today);
  const dailyQuests = QUESTS.filter((quest) => quest.period === 'daily').map((quest) => {
    const progress = countQuestProgress(quest, state.events, today);
    const record = state.quests[questRecordKey(quest.id, quest.period, today)];
    return { quest, shown: Math.min(progress, quest.goal.count), done: record?.status === 'completed' };
  });
  const completedDaily = dailyQuests.filter((row) => row.done).length;
  const nextChallenge = dailyQuests.find((row) => !row.done) ?? null;
  const recentAchievements = Object.entries(state.achievements)
    .sort(([, a], [, b]) => b.localeCompare(a))
    .slice(0, 3)
    .flatMap(([id]) => ACHIEVEMENTS.filter((achievement) => achievement.id === id));
  const daysLeft = daysLeftInMonth(today);
  const over = summary.remainingPaise !== null && summary.remainingPaise < 0;
  const animatedRemaining = useCountUp(summary.remainingPaise ?? 0);
  const featuredCardRef = useRef<HTMLDivElement>(null);
  const glowX = useSpring(useMotionValue(50), { stiffness: 120, damping: 20 });
  const glowY = useSpring(useMotionValue(40), { stiffness: 120, damping: 20 });
  const glowBg = useTransform(
    [glowX, glowY] as const,
    ([x, y]) => `radial-gradient(280px circle at ${x}% ${y}%, ${featured.color}40, transparent 70%)`,
  );
  const handleFeaturedMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-400">{formatMonthLabel(monthKeyOf(today))}</p>
          <h1 className="text-3xl font-bold text-ink-50 sm:text-4xl">Your monsters are eating well.</h1>
          <p className="text-sm text-ink-300">
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left this month.{' '}
            {summary.remainingPaise === null
              ? 'Set a monthly budget to start tracking.'
              : over
                ? 'You are over budget. Take it easy this week.'
                : 'Keep logging to feed your monsters.'}
          </p>
        </div>
        <div className="card min-w-[240px] px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-400">Remaining this month</p>
          <p
            className={`mt-1.5 font-display text-4xl font-bold ${
              summary.remainingPaise === null ? 'text-ink-300' : over ? 'text-rose-300' : 'text-amber-300'
            }`}
          >
            {summary.remainingPaise === null ? 'Not set' : formatMoney(Math.round(animatedRemaining))}
          </p>
        </div>
      </header>

      <StaggerItem index={0}>
        <section className="card px-4 py-8 sm:px-8">
          <QuickActions onNavigate={onNavigate} />
        </section>
      </StaggerItem>

      <SavingsOverview onNavigate={onNavigate} />

      <div className="grid gap-6 lg:grid-cols-12">
        <StaggerItem index={1} className="lg:col-span-4">
          <motion.section
            ref={featuredCardRef}
            onMouseMove={handleFeaturedMouseMove}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card relative h-full overflow-hidden p-6 sm:p-8"
          >
            <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: glowBg }} />
            <div className="relative flex flex-col items-center text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-400">Featured monster</p>
            <div className="my-4">
              <MonsterStage monsterId={featured.id} level={featuredProgress.level} stage={featuredProgress.stage} size="lg" />
            </div>
            <div className="relative max-w-xs rounded-2xl border border-white/10 bg-night-950/70 px-4 py-3 text-sm italic leading-relaxed text-ink-100">
              <p>&ldquo;{featured.personality}&rdquo;</p>
              <span aria-hidden className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/10 bg-night-950" />
            </div>
            <h2 className="text-2xl font-bold text-ink-50">{featured.name}</h2>
            <p className="mt-1 text-sm text-ink-300">
              Level {featuredProgress.level} · {stageName(featured.id, featuredProgress.stage)}
            </p>
            <div className="mt-5 w-full max-w-xs text-left">
              <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-300">
                <span>XP to next level</span>
                <span>
                  {featuredProgress.isMaxLevel
                    ? 'Max level'
                    : `${featuredProgress.xpIntoLevel} / ${featuredProgress.xpForNextLevel}`}
                </span>
              </div>
              <ProgressBar value={featuredProgress.percent} tone="volt" label="Featured monster XP" />
            </div>
            <Button variant="ghost" size="sm" className="mt-6" onClick={() => onNavigate('monsters')}>
              <PawPrint className="h-4 w-4" /> View collection
            </Button>
          </div>
          </motion.section>
        </StaggerItem>

        <StaggerItem index={2} className="lg:col-span-8">
        <section className="card h-full p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
                <Wallet className="h-5 w-5 text-amber-300" /> Budget overview
              </h2>
              <p className="mt-1 text-sm text-ink-300">How much of this month&apos;s budget you have used.</p>
            </div>
            <div className="flex items-center gap-4">
              {summary.usedPercent !== null && (
                <div className="hidden flex-col items-center gap-1 sm:flex">
                  <ProgressRing value={summary.usedPercent} tone={budgetTone(summary.usedPercent)} label="Monthly budget used" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Managed</span>
                </div>
              )}
              <Button variant="subtle" size="sm" onClick={() => onNavigate('expenses')}>
                Manage <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <BudgetSummary summary={summary} />
        </section>
        </StaggerItem>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <StreakWeek
            events={state.events}
            todayKey={today}
            streak={streak}
            onLogToday={() => onNavigate('expenses')}
          />
        </div>

        <section className="card p-6 sm:p-8 lg:col-span-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
                <Scroll className="h-5 w-5 text-neon-300" /> Active quests
              </h2>
              <p className="mt-1 text-sm text-ink-300">{completedDaily} / {dailyQuests.length} complete today</p>
            </div>
            <Button variant="subtle" size="sm" onClick={() => onNavigate('quests')}>
              All quests <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <ul className="space-y-3">
            {dailyQuests.map(({ quest, shown, done }) => (
              <li
                key={quest.id}
                className={`rounded-xl border p-4 transition ${
                  done ? 'border-neon-400/35 bg-neon-500/5' : 'border-white/10 bg-night-950/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-50">{quest.name}</p>
                    <p className="text-xs text-ink-400">{done ? 'Completed today' : `${shown} / ${quest.goal.count} done`}</p>
                  </div>
                  <span
                    className={
                      done
                        ? 'shrink-0 rounded-md bg-neon-500/15 px-2.5 py-1 text-xs font-bold text-neon-300'
                        : 'shrink-0 rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300'
                    }
                  >
                    {done ? 'Done' : `+${quest.rewardXp} XP`}
                  </span>
                </div>
                <ProgressBar
                  className="mt-3"
                  height="sm"
                  value={(shown / quest.goal.count) * 100}
                  tone={done ? 'neon' : 'volt'}
                  label={`${quest.name} progress`}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <RecentExpenses expenses={state.expenses} today={today} onViewAll={() => onNavigate('expenses')} />

      <InsightsCard />

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-6 text-night-950 shadow-glow-amber sm:p-8 lg:col-span-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-night-900/80">Daily challenge</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight sm:text-4xl">
            {nextChallenge ? nextChallenge.quest.name : 'All clear for today'}
          </h2>
          <p className="mt-2 max-w-md text-sm font-medium text-night-900/85">
            {nextChallenge
              ? `Finish it for +${nextChallenge.quest.rewardXp} XP to your monster.`
              : 'You finished every daily quest. Come back tomorrow for more.'}
          </p>
          {nextChallenge && (
            <Button variant="primary" size="md" className="mt-6 bg-night-950 text-amber-300 hover:bg-night-900 hover:text-amber-200" onClick={() => onNavigate('quests')}>
              Join challenge <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </section>

        <section className="card p-6 sm:p-8 lg:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
              <Trophy className="h-5 w-5 text-amber-300" /> Recent achievements
            </h2>
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs font-bold text-ink-300">
              {Object.keys(state.achievements).length} / {ACHIEVEMENTS.length}
            </span>
          </div>
          {recentAchievements.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-ink-300">
              No achievements yet. Log an expense or finish a quest to unlock your first one.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentAchievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <li key={achievement.id} className="flex items-center gap-4 rounded-xl border border-amber-400/25 bg-amber-500/5 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink-50">{achievement.title}</p>
                      <p className="text-xs text-ink-300">{achievement.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-400">
        <Sparkles className="h-3.5 w-3.5" /> Sample expenses are marked SAMPLE and can be reset from the Data menu.
      </p>
    </div>
  );
}
