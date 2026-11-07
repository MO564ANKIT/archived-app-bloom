import { ArrowRight, Check, PiggyBank, Receipt } from 'lucide-react';
import type { PageId } from '@/components/layout/BottomNav';
import { Button } from '@/components/kit/Button';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { Skeleton } from '@/components/kit/Skeleton';
import { SandboxBadge } from '@/components/checkout/SandboxBadge';
import { StatusPill } from '@/components/checkout/StatusPill';
import { LOOT_BY_ID } from '@/lib/lootCatalogue';
import { formatUsdCents } from '@/lib/money';
import { goalProgress, useGoals, useTransactions } from '@/lib/ledger';
import { cn } from '@/lib/cn';
import { useGame } from '@/state/gameContext';

export function SavingsOverview({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const goals = useGoals();
  const transactions = useTransactions();
  const { state } = useGame();
  const activeGoal = (goals.data ?? []).find((goal) => !goal.completed_at) ?? goals.data?.[0] ?? null;
  const recent = (transactions.data ?? []).slice(0, 4);
  const goalNames = Object.fromEntries((goals.data ?? []).map((goal) => [goal.id, goal.name])) as Record<string, string>;
  const hasVerifiedContribution = (transactions.data ?? []).some((tx) => tx.kind === 'goal_contribution' && tx.status === 'completed');
  const usedGuardian = state.events.some((event) => event.type === 'purchase_reconsidered' || event.type === 'purchase_completed');
  const reviewed = state.events.some((event) => event.type === 'spending_reviewed');

  const steps: { label: string; done: boolean; page: PageId }[] = [
    { label: 'Create a savings goal', done: (goals.data ?? []).length > 0, page: 'goals' },
    { label: 'Contribute with PayPal Sandbox', done: hasVerifiedContribution, page: 'goals' },
    { label: 'Check an item with the Purchase Guardian', done: usedGuardian, page: 'shop' },
    { label: 'Review your spending', done: reviewed, page: 'vault' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="card p-6 sm:p-8 lg:col-span-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
            <PiggyBank className="h-5 w-5 text-neon-300" /> PayPal savings quest
          </h2>
          <SandboxBadge />
        </div>
        {goals.isLoading ? (
          <Skeleton className="h-24" />
        ) : activeGoal ? (
          <div>
            <p className="font-semibold text-ink-50">{activeGoal.name}</p>
            <p className="mt-1 text-sm text-ink-300">
              {formatUsdCents(activeGoal.contributed_cents)} of {formatUsdCents(activeGoal.target_cents)} saved
            </p>
            <ProgressBar className="mt-3" value={goalProgress(activeGoal)} tone="neon" label={`${activeGoal.name} progress`} />
            <p className="mt-2 text-xs text-ink-400">Only verified PayPal Sandbox contributions count. Simulated, not a real deposit.</p>
          </div>
        ) : (
          <p className="text-sm text-ink-300">No goal yet. Create one to start levelling up Saverion with simulated savings.</p>
        )}
        <Button variant="primary" size="sm" className="mt-5" onClick={() => onNavigate('goals')}>
          {activeGoal ? 'Contribute' : 'Create a goal'} <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-400">Demo journey</p>
          <ol className="mt-3 space-y-2">
            {steps.map((step, index) => (
              <li key={step.label}>
                <button
                  type="button"
                  onClick={() => onNavigate(step.page)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-white/5"
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      step.done ? 'bg-neon-500 text-night-950' : 'border border-white/20 text-ink-300',
                    )}
                  >
                    {step.done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span className={step.done ? 'text-ink-300 line-through' : 'text-ink-100'}>{step.label}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card p-6 sm:p-8 lg:col-span-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
            <Receipt className="h-5 w-5 text-aqua-300" /> Recent PayPal transactions
          </h2>
          <Button variant="subtle" size="sm" onClick={() => onNavigate('vault')}>
            Open vault <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {transactions.isLoading ? (
          <Skeleton className="h-40" />
        ) : transactions.isError ? (
          <p role="alert" className="text-sm text-rose-200">{transactions.error.message}</p>
        ) : recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-ink-300">
            No PayPal Sandbox payments yet. Your contributions and purchases will show here.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {recent.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-50">
                    {tx.kind === 'goal_contribution'
                      ? `Saved toward ${tx.goal_id ? goalNames[tx.goal_id] ?? 'a goal' : 'a goal'}`
                      : tx.item_ids.map((id) => LOOT_BY_ID[id]?.name ?? id).join(', ') || 'Marketplace purchase'}
                  </p>
                  <p className="text-xs text-ink-400">{new Date(tx.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={tx.status} />
                  <span className="font-bold text-ink-50">{formatUsdCents(tx.amount_cents)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
