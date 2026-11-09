import { MILESTONE_REWARDS } from '@/lib/lootCatalogue';
// XP rules for verified savings activity. Each server record is claimed once (see claimRewards).
export const XP_PER_DOLLAR_SAVED = 10;
export const MAX_CONTRIBUTION_XP = 250;

/** XP for one verified goal contribution: 10 XP per whole US$1, capped at 250. */
export function contributionXp(amountCents: number): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  return Math.min(MAX_CONTRIBUTION_XP, Math.floor(amountCents / 100) * XP_PER_DOLLAR_SAVED);
}

/** XP Saverion earns from one verified capture: the contribution itself plus any newly granted milestones. */
export function captureXp(kind: 'shop' | 'goal_contribution', amountCents: number, milestones: number[]): number {
  if (kind !== 'goal_contribution') return 0;
  return contributionXp(amountCents) + milestones.reduce((sum, m) => sum + (MILESTONE_REWARDS[m]?.xp ?? 0), 0);
}
