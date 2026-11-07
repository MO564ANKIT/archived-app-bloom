import { motion } from 'framer-motion';
import { CheckCircle2, Lock, Sparkles, Swords } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { getSpecies } from '@/lib/monsters';
import type { QuestDefinition } from '@/lib/quests';
import type { EventType, QuestRecord } from '@/types';

const EVENT_UNITS: Record<Exclude<EventType, 'quest_completed'>, string> = {
  expense_logged: 'expenses logged',
  simulation: 'Money Lab runs',
  purchase_skipped: 'purchases skipped',
  cart_abandoned: 'carts abandoned',
  purchase_completed: 'checkouts completed',
  goal_contribution: 'verified contributions',
  milestone_reached: 'milestones reached',
  purchase_reconsidered: 'items saved for later',
  spending_reviewed: 'spending reviews',
};

const DIFFICULTY_CLASS: Record<QuestDefinition['difficulty'], string> = {
  easy: 'bg-neon-500/15 text-neon-300',
  medium: 'bg-aqua-500/15 text-aqua-300',
  hard: 'bg-rose-500/15 text-rose-300',
};

type QuestStatus = 'available' | 'active' | 'ready' | 'completed';

interface QuestRowProps {
  quest: QuestDefinition;
  progress: number;
  record: QuestRecord | null;
  onStart: () => void;
  onClaim: () => void;
}

export function QuestRow({ quest, progress, record, onStart, onClaim }: QuestRowProps) {
  const goal = quest.goal.count;
  const status: QuestStatus = !record
    ? 'available'
    : record.status === 'completed'
      ? 'completed'
      : progress >= goal
        ? 'ready'
        : 'active';
  const percent = Math.min(100, Math.round((progress / goal) * 100));
  const reward = getSpecies(quest.rewardMonster);
  const unit = quest.goal.category ? 'subscription expenses' : EVENT_UNITS[quest.goal.event as keyof typeof EVENT_UNITS];

  return (
    <article className="rounded-2xl border border-white/10 bg-night-950/50 p-5 transition hover:border-white/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-volt-400/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-volt-200">
              {quest.period}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${DIFFICULTY_CLASS[quest.difficulty]}`}>
              {quest.difficulty}
            </span>
            {status === 'completed' && (
              <span className="flex items-center gap-1 text-xs font-bold text-neon-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-bold text-ink-50">{quest.name}</h3>
          <p className="mt-1 text-sm text-ink-300">{quest.description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
          +{quest.rewardXp} XP for {reward.name}
        </span>
      </div>

      <p className="mt-4 text-xs text-ink-400">Rule: {quest.rule}</p>

      <div className="mt-3">
        <div className="mb-2 flex justify-between text-xs font-medium text-ink-300">
          <span>
            {Math.min(progress, goal)} / {goal} {unit}
          </span>
          <span>{percent}%</span>
        </div>
        <ProgressBar value={percent} tone={status === 'completed' ? 'volt' : 'neon'} height="sm" label={`${quest.name} progress`} />
      </div>

      <div className="mt-4 flex justify-end">
        {status === 'available' && (
          <Button variant="ghost" size="sm" onClick={onStart}>
            <Swords className="h-4 w-4" /> Start quest
          </Button>
        )}
        {status === 'active' && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink-300">
            <Lock className="h-3.5 w-3.5" /> In progress
          </span>
        )}
        {status === 'ready' && (
          <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
            <Button variant="primary" size="sm" onClick={onClaim}>
              <Sparkles className="h-4 w-4" /> Claim reward
            </Button>
          </motion.div>
        )}
      </div>
    </article>
  );
}
