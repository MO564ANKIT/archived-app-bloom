import { useEffect } from 'react';
import { useGoalRewards, useTransactions } from '@/lib/ledger';
import { pendingRewardClaims } from '@/lib/rewardClaims';
import { useGame } from '@/state/gameContext';

/** Applies XP for verified contributions and granted milestones, once per server record. */
export function MilestoneSync() {
  const { state, claimRewards } = useGame();
  const { data: rewards } = useGoalRewards();
  const { data: transactions } = useTransactions();

  useEffect(() => {
    if (!rewards || !transactions) return;
    const fresh = pendingRewardClaims(transactions, rewards, state.claimedRewards);
    if (fresh.length) claimRewards(fresh);
  }, [rewards, transactions, state.claimedRewards, claimRewards]);

  return null;
}
