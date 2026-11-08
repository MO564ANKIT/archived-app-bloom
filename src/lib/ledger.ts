// Read-only views of the player's server records (RLS limits each query to the signed-in player).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type OrderStatus = 'created' | 'capturing' | 'pending' | 'cancelled' | 'completed' | 'failed' | 'refunded';

export interface PaypalTransaction {
  id: string;
  paypal_order_id: string;
  paypal_capture_id: string | null;
  kind: 'shop' | 'goal_contribution';
  goal_id: string | null;
  item_ids: string[];
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  captured_at: string | null;
  is_demo: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_cents: number;
  contributed_cents: number;
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  is_demo: boolean;
}

export interface GoalReward {
  id: string;
  goal_id: string;
  milestone: number;
  order_id: string | null;
  granted_at: string;
}

export interface InventoryItem {
  item_id: string;
  source: 'purchase' | 'milestone';
  acquired_at: string;
}

export const ledgerKeys = {
  transactions: ['ledger', 'transactions'] as const,
  goals: ['ledger', 'goals'] as const,
  rewards: ['ledger', 'rewards'] as const,
  inventory: ['ledger', 'inventory'] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: ledgerKeys.transactions,
    queryFn: async (): Promise<PaypalTransaction[]> => {
      const { data, error } = await supabase
        .from('shop_orders')
        .select('id, paypal_order_id, paypal_capture_id, kind, goal_id, item_ids, amount_cents, currency, status, failure_reason, created_at, updated_at, captured_at, is_demo')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw new Error('Your transactions could not be loaded.');
      return (data ?? []) as PaypalTransaction[];
    },
    // While PayPal is still confirming a payment (e.g. waiting on the webhook), keep checking.
    refetchInterval: (query) =>
      (query.state.data ?? []).some((tx) => tx.status === 'pending' || tx.status === 'capturing') ? 5000 : false,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ledgerKeys.goals,
    queryFn: async (): Promise<SavingsGoal[]> => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('id, name, target_cents, contributed_cents, deadline, completed_at, created_at, is_demo')
        .order('created_at', { ascending: false });
      if (error) throw new Error('Your savings goals could not be loaded.');
      return data ?? [];
    },
  });
}

export function useGoalRewards() {
  return useQuery({
    queryKey: ledgerKeys.rewards,
    queryFn: async (): Promise<GoalReward[]> => {
      const { data, error } = await supabase
        .from('goal_rewards')
        .select('id, goal_id, milestone, order_id, granted_at')
        .order('granted_at', { ascending: true });
      if (error) throw new Error('Your milestone rewards could not be loaded.');
      return data ?? [];
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ledgerKeys.inventory,
    queryFn: async (): Promise<InventoryItem[]> => {
      const { data, error } = await supabase.from('user_inventory').select('item_id, source, acquired_at');
      if (error) throw new Error('Your inventory could not be loaded.');
      return (data ?? []) as InventoryItem[];
    },
  });
}

export function useRefreshLedger() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['ledger'] });
}

/** Total of verified (completed) PayPal Sandbox goal contributions, excluding demo rows. */
export function totalSavedCents(transactions: PaypalTransaction[], includeDemo = false): number {
  return transactions
    .filter((tx) => tx.kind === 'goal_contribution' && tx.status === 'completed' && (includeDemo || !tx.is_demo))
    .reduce((sum, tx) => sum + tx.amount_cents, 0);
}

export function goalProgress(goal: Pick<SavingsGoal, 'target_cents' | 'contributed_cents'>): number {
  if (goal.target_cents <= 0) return 0;
  return Math.min(100, Math.floor((goal.contributed_cents / goal.target_cents) * 100));
}
