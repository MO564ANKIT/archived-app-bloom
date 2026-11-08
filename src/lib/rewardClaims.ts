import { MILESTONE_REWARDS } from '@/lib/lootCatalogue';
import { contributionXp } from '@/lib/rewards';
import type { GoalReward, PaypalTransaction } from '@/lib/ledger';
import type { RewardClaim } from '@/state/gameReducer';

/**
 * Builds the XP claims the player has not applied yet from server records:
 * verified goal contributions and granted milestones. Demo rows never give XP.
 * Works the same whether the webhook or the return page confirmed the payment.
 */
export function pendingRewardClaims(
  transactions: PaypalTransaction[],
  rewards: GoalReward[],
  claimed: Record<string, string>,
): RewardClaim[] {
  const demoOrders = new Set(transactions.filter((tx) => tx.is_demo).map((tx) => tx.paypal_order_id));
  const claims: RewardClaim[] = [];
  for (const tx of transactions) {
    if (tx.kind !== 'goal_contribution' || tx.status !== 'completed' || tx.is_demo || claimed[tx.id]) continue;
    claims.push({ id: tx.id, xp: contributionXp(tx.amount_cents), kind: 'contribution' });
  }
  for (const reward of rewards) {
    if (claimed[reward.id] || (reward.order_id && demoOrders.has(reward.order_id))) continue;
    claims.push({ id: reward.id, xp: MILESTONE_REWARDS[reward.milestone]?.xp ?? 0, kind: 'milestone' });
  }
  return claims;
}
