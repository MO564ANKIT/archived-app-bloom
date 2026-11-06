import { PiggyBank } from 'lucide-react';
import { EmptyState } from '@/components/kit/EmptyState';
import { SandboxBadge } from '@/components/checkout/SandboxBadge';
import { CreateGoalForm } from '@/components/goals/CreateGoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { MonsterProgressCard } from '@/components/goals/MonsterProgressCard';
import { Skeleton } from '@/components/kit/Skeleton';
import { useGoalRewards, useGoals, useTransactions } from '@/lib/ledger';

export function GoalsPage() {
  const goals = useGoals();
  const rewards = useGoalRewards();
  const transactions = useTransactions();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium text-neon-400">Save to Level</p>
          <SandboxBadge />
        </div>
        <h1 className="text-3xl font-bold text-ink-50 sm:text-4xl">Pay. Save. Evolve.</h1>
        <p className="max-w-2xl text-sm text-ink-300">
          Set a goal, contribute through PayPal Sandbox, and watch Saverion grow. Progress only moves after our server verifies the capture with PayPal. These are simulated contributions, not real savings deposits.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {goals.isLoading ? (
            <Skeleton className="h-96" />
          ) : goals.isError ? (
            <p role="alert" className="card p-6 text-sm text-rose-300">
              {goals.error.message}
            </p>
          ) : goals.data && goals.data.length > 0 ? (
            goals.data.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                rewards={(rewards.data ?? []).filter((reward) => reward.goal_id === goal.id)}
                contributions={(transactions.data ?? []).filter((tx) => tx.goal_id === goal.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={<PiggyBank className="h-6 w-6" />}
              title="No savings goals yet"
              description="Create your first goal to start leveling up with verified PayPal Sandbox contributions."
            />
          )}
        </div>
        <aside className="space-y-6 lg:col-span-2">
          <CreateGoalForm />
          <MonsterProgressCard caption="Savings monster" />
          <div className="card space-y-2 p-5 text-sm text-ink-300">
            <h2 className="font-bold text-ink-50">How rewards work</h2>
            <p>Each milestone is granted once per goal by the server, right after PayPal confirms the payment. The browser never decides what you earned.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
