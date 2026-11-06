import { useState } from 'react';
import { CalendarDays, Check, Lock, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/kit/Button';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { StatusPill } from '@/components/checkout/StatusPill';
import { MILESTONE_REWARDS } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { goalProgress, useRefreshLedger, type GoalReward, type PaypalTransaction, type SavingsGoal } from '@/lib/ledger';
import { createGoalContribution } from '@/lib/paypalCheckout';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/cn';

const PRESETS = [500, 1000, 2500];
const MILESTONES = [25, 50, 75, 100];

interface GoalCardProps {
  goal: SavingsGoal;
  rewards: GoalReward[];
  contributions: PaypalTransaction[];
}

export function GoalCard({ goal, rewards, contributions }: GoalCardProps) {
  const refresh = useRefreshLedger();
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
    <article className="card space-y-5 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-ink-50">{goal.name}</h3>
          {goal.deadline && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
              <CalendarDays className="h-3.5 w-3.5" /> Target date {goal.deadline}
            </p>
          )}
        </div>
        <p className="font-display text-3xl font-bold text-neon-400">{percent}%</p>
      </header>

      <ProgressBar value={percent} label={`${goal.name} progress`} />

      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-night-950/50 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-ink-400">Target</dt>
          <dd className="mt-1 font-bold text-ink-50">{formatUsdCents(goal.target_cents)}</dd>
        </div>
        <div className="rounded-2xl bg-night-950/50 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-ink-400">Verified</dt>
          <dd className="mt-1 font-bold text-neon-300">{formatUsdCents(goal.contributed_cents)}</dd>
        </div>
        <div className="rounded-2xl bg-night-950/50 p-3">
          <dt className="text-[11px] uppercase tracking-wider text-ink-400">Remaining</dt>
          <dd className="mt-1 font-bold text-ink-50">{formatUsdCents(remaining)}</dd>
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
          <Button variant="primary" className="w-full" disabled={!amount || busy} onClick={contribute}>
            {busy ? 'Opening PayPal Sandbox...' : `Contribute ${amount ? formatUsdCents(amount) : ''} with PayPal`}
          </Button>
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
                <span className="text-ink-300">{new Date(tx.created_at).toLocaleDateString()}</span>
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
