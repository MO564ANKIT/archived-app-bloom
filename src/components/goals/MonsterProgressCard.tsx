import { MonsterImage } from '@/components/monsters/MonsterImage';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { getLevelProgress, getSpecies, stageName } from '@/lib/monsters';
import { useGame } from '@/state/gameContext';
import type { MonsterId } from '@/types';

export function MonsterProgressCard({ monsterId = 'saverion', caption }: { monsterId?: MonsterId; caption: string }) {
  const { state } = useGame();
  const species = getSpecies(monsterId);
  const progress = getLevelProgress(state.monsters[monsterId].xp);
  const locked = state.monsters[monsterId].unlockedAt === null;
  return (
    <div className="card flex items-center gap-4 p-5">
      <MonsterImage monsterId={monsterId} stage={progress.stage} locked={locked} className="h-20 w-20 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-volt-300">{caption}</p>
        <p className="mt-0.5 font-display text-xl font-bold text-ink-50">
          {stageName(monsterId, progress.stage)} <span className="text-sm font-medium text-ink-300">Lv {progress.level}</span>
        </p>
        <ProgressBar value={progress.percent} tone="volt" height="sm" className="mt-2" label={`${species.name} level progress`} />
        <p className="mt-1.5 text-xs text-ink-400">
          {progress.isMaxLevel ? 'Max level reached' : `${progress.xpIntoLevel} / ${progress.xpForNextLevel} XP to next level`}
          {locked ? ' · Unlock by playing quests' : ''}
        </p>
      </div>
    </div>
  );
}
