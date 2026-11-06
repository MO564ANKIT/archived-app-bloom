import { useEffect } from 'react';
import { MILESTONE_REWARDS } from '@/lib/lootCatalogue';
import { useGoalRewards } from '@/lib/ledger';
import { useGame } from '@/state/gameContext';

/** Applies XP for savings milestones the server has granted, once per milestone. */
export function MilestoneSync() {
  const { state, claimMilestoneRewards } = useGame();
  const { data: rewards } = useGoalRewards();

  useEffect(() => {
    if (!rewards) return;
    const fresh = rewards
      .filter((reward) => !state.claimedRewards[reward.id])
      .map((reward) => ({ id: reward.id, xp: MILESTONE_REWARDS[reward.milestone]?.xp ?? 0 }));
    if (fresh.length) claimMilestoneRewards(fresh);
  }, [rewards, state.claimedRewards, claimMilestoneRewards]);

  return null;
}
