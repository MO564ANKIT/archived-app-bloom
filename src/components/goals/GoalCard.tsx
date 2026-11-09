import { useState } from 'react';
import { CalendarDays, Check, Lock, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { ProgressRing } from '@/components/kit/ProgressRing';
import { StatusPill } from '@/components/checkout/StatusPill';
import { TestModeNote } from '@/components/checkout/SetupNotice';
import { MILESTONE_REWARDS } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { daysBetweenKeys } from '@/lib/dates';
import { goalProgress, useRefreshLedger, type GoalReward, type PaypalTransaction, type SavingsGoal } from '@/lib/ledger';
import { createGoalContribution } from '@/lib/paypalCheckout';
import { usePaypalSetup } from '@/lib/paypalSetup';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import { useGame } from '@/state/gameContext';

const PRESETS = [500, 1000, 2500];
const MILESTONES = [25, 50, 75, 100];

interface GoalCardProps {
  goal: SavingsGoal;
  rewards: GoalReward[];
  contributions: PaypalTransaction[];
  /** Marks the first active goal's contribute button for the guided tour. */
  tourTarget?: boolean;
}

function countdownLabel(today: string, deadline: string, complete: boolean): { text: string; tone: string } {
  if (complete) return { text: `Target date ${deadline}`, tone: 'text-ink-400' };
  const days = daysBetweenKeys(today, deadline);
  if (days < 0) return { text: `Deadline passed ${-days} day${days === -1 ? '' : 's'} ago`, tone: 'text-rose-300' };
  if (days === 0) return { text: 'Due today', tone: 'text-amber-300' };
  return { text: `${days} day${days === 1 ? '' : 's'} left · ${deadline}`, tone: days <= 7 ? 'text-amber-300' : 'text-ink-300' };
}

export function GoalCard({ goal, rewards, contributions, tourTarget }: GoalCardProps) {
  const { today } = useGame();
  const refresh = useRefreshLedger();
  const setup = usePaypalSetup();
  const remaining = Math.max(0, goal.target_cents - goal.contributed_cents);
  const percent = goalProgress(goal);
  const presets = [...new Set(PRESETS.filter((cents) => cents <= remaining).concat(remaining > 0 && remaining <= 50000 ? [remaining] : []))]
    .filter((cents) => cents >= 100)
    .sort((a, b) => a - b)
    .slice(0, 4);
  const [amount, setAmount] = useState<number | null>(presets[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reached = new Set(rewards.map((reward) => reward.milestone));
  const complete = goal.completed_at !== null;
  const checkoutPaused = setup.data?.checkoutReady === false;
  const countdown = goal.deadline ? countdownLabel(today, goal.deadline, complete) : null;

  const contribute = async () => {
    if (!amount) return;
    setBusy(true);
    setError(null);
    try {
      const { approveUrl } = await createGoalContribution(goal.id, amount);
      window.location.assign(approveUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start PayPal. Please try again.');
      setBusy(false);
    }
  };

  const remove = async () => {
    setError(null);
    const { error: deleteError } = await supabase.from('savings_goals').delete().eq('id', goal.id);
    if (deleteError) setError('This goal could not be deleted.');
    await refresh();
  };

  return (
    <article className="card space-y-5 p-5 sm:p-6">
      <header className="flex items-start gap-4">
        <ProgressRing value={percent} size={76} tone={complete ? 'amber' : 'neon'} label={`${goal.name} progress`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-xl font-bold text-ink-50">{goal.name}</h3>
            {goal.is_demo && <span className="rounded-full bg-volt-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-volt-300">Demo data</span>}
          </div>
          {countdown && (
            <p className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', countdown.tone)}>
              <CalendarDays className="h-3.5 w-3.5" /> {countdown.text}
            </p>
          )}
          <p className="mt-1 text-sm text-ink-300">
            {complete ? 'Goal reached' : `${formatUsdCents(remaining)} to go`}
          </p>
        </div>
      </header>

      <div className="relative pt-1">
        <ProgressBar value={percent} tone={complete ? 'amber' : 'neon'} label={`${goal.name} progress bar`} />
        {MILESTONES.slice(0, 3).map((milestone) => (
          <span
            key={milestone}
            aria-hidden="true"
            className={cn('absolute top-0 h-[calc(100%+4px)] w-0.5 -translate-x-1/2 rounded-full', reached.has(milestone) ? 'bg-neon-200' : 'bg-white/30')}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="rounded-2xl bg-night-950/50 p-2.5 sm:p-3">
          <dt className="text-[10px] uppercase tracking-wider text-ink-400 sm:text-[11px]">Target</dt>
          <dd className="mt-1 text-sm font-bold text-ink-50 sm:text-base">{formatUsdCents(goal.target_cents)}</dd>
        </div>
        <div className="rounded-2xl bg-night-950/50 p-2.5 sm:p-3">
          <dt className="text-[10px] uppercase tracking-wider text-ink-400 sm:text-[11px]">Verified</dt>
          <dd className="mt-1 text-sm font-bold text-neon-300 sm:text-base">{formatUsdCents(goal.contributed_cents)}</dd>
        </div>
        <div className="rounded-2xl bg-night-950/50 p-2.5 sm:p-3">
          <dt className="text-[10px] uppercase tracking-wider text-ink-400 sm:text-[11px]">Remaining</dt>
          <dd className="mt-1 text-sm font-bold text-ink-50 sm:text-base">{formatUsdCents(remaining)}</dd>
        </div>
      </dl>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Milestones">
        {MILESTONES.map((milestone) => {
          const done = reached.has(milestone);
          return (
            <li
              key={milestone}
              className={cn(
                'rounded-2xl border p-3 text-xs',
                done ? 'border-neon-400/50 bg-neon-500/10 text-neon-200' : 'border-white/10 bg-night-950/40 text-ink-400',
              )}
            >
              <p className="flex items-center gap-1.5 font-bold">
                {done ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {milestone}%
              </p>
              <p className="mt-1 leading-snug">{MILESTONE_REWARDS[milestone].label}</p>
              {done && <p className="mt-1 text-[10px] uppercase tracking-wider text-neon-300/80">Claimed once</p>}
            </li>
          );
        })}
      </ol>

      {complete ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <Trophy className="h-6 w-6 shrink-0" /> Legendary goal complete. Every contribution here was verified with PayPal Sandbox.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-200">Contribution amount</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => setAmount(cents)}
                aria-pressed={amount === cents}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                  amount === cents ? 'border-neon-400 bg-neon-500/15 text-neon-300' : 'border-white/15 text-ink-200 hover:border-white/30',
                )}
              >
                {formatUsdCents(cents)}
                {cents === remaining ? ' (finish)' : ''}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={!amount || busy || checkoutPaused}
            onClick={contribute}
            data-tour={tourTarget ? 'contribute' : undefined}
          >
            {checkoutPaused
              ? 'Sandbox setup needed'
              : busy
                ? 'Opening PayPal Sandbox...'
                : `Contribute ${amount ? formatUsdCents(amount) : ''} with PayPal`}
          </Button>
          <TestModeNote />
          <p className="text-xs text-ink-400">Simulated contribution: a PayPal Sandbox merchant payment. Spendemon does not hold or store your money.</p>
        </div>
      )}

      <section>
        <h4 className="text-sm font-bold text-ink-100">Contribution history</h4>
        {contributions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-400">No contributions yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-white/10 text-sm">
            {contributions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-ink-300">{new Date(tx.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                <StatusPill status={tx.status} />
                <span className="font-semibold text-ink-50">{formatUsdCents(tx.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {goal.contributed_cents === 0 && (
        <div className="flex justify-end">
          <Button variant="subtle" size="sm" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Delete goal
          </Button>
        </div>
      )}
    </article>
  );
}
