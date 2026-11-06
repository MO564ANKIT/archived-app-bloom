import { useState } from 'react';
import { Check, Lock, Star } from 'lucide-react';
import { MonsterCard, RarityBadge } from '@/components/monsters/MonsterCard';
import { MonsterStage } from '@/components/monsters/MonsterStage';
import { Button } from '@/components/kit/Button';
import { Modal } from '@/components/kit/Modal';
import { ProgressBar } from '@/components/kit/ProgressBar';
import { MONSTER_SPECIES, STAGE_START_LEVELS, getLevelProgress, stageName, type MonsterSpecies, type Stage } from '@/lib/monsters';
import type { MonsterProgress, MonsterId } from '@/types';
import { useGame } from '@/state/gameContext';

const STAGES: Stage[] = [1, 2, 3];

export function MonstersPage() {
  const { state, setFeatured } = useGame();
  const [openId, setOpenId] = useState<MonsterId | null>(null);

  const unlockedCount = MONSTER_SPECIES.filter((species) => state.monsters[species.id].unlockedAt !== null).length;
  const selected = MONSTER_SPECIES.find((species) => species.id === openId) ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neon-400">Monster collection</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Your crew of six</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Each expense feeds the monster that matches its category. Monsters evolve at level 10 and level 20.
          </p>
        </div>
        <div className="card min-w-[200px] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Collection</p>
          <p className="mt-1 font-display text-2xl font-bold text-neon-300">
            {unlockedCount} / {MONSTER_SPECIES.length} unlocked
          </p>
          <div className="mt-3">
            <ProgressBar
              value={Math.round((unlockedCount / MONSTER_SPECIES.length) * 100)}
              tone="neon"
              label="Collection completion"
            />
          </div>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {MONSTER_SPECIES.map((species) => (
          <MonsterCard
            key={species.id}
            species={species}
            progress={state.monsters[species.id]}
            featured={state.featuredMonsterId === species.id}
            onOpen={() => setOpenId(species.id)}
          />
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setOpenId(null)}
        title={selected?.name ?? ''}
        description={selected ? `${selected.rarity} · ${selected.personality}` : undefined}
      >
        {selected && (
          <MonsterDetail
            species={selected}
            progress={state.monsters[selected.id]}
            isFeatured={state.featuredMonsterId === selected.id}
            onFeature={() => setFeatured(selected.id)}
          />
        )}
      </Modal>
    </div>
  );
}

interface MonsterDetailProps {
  species: MonsterSpecies;
  progress: MonsterProgress;
  isFeatured: boolean;
  onFeature: () => void;
}

function MonsterDetail({ species, progress, isFeatured, onFeature }: MonsterDetailProps) {
  const unlocked = progress.unlockedAt !== null;
  const info = getLevelProgress(progress.xp);

  return (
    <div className="space-y-6">
      <div
        className="flex flex-col items-center gap-4 rounded-2xl p-4 sm:flex-row"
        style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${species.color}33, transparent 70%)` }}
      >
        <MonsterStage monsterId={species.id} level={info.level} stage={info.stage} locked={!unlocked} size="lg" />
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <RarityBadge rarity={species.rarity} />
          <p className="text-sm text-ink-200">
            {unlocked ? `Level ${info.level} · ${stageName(species.id, info.stage)}` : `Unlock: ${species.unlockText}`}
          </p>
          {unlocked && (
            <div>
              <div className="mb-1.5 flex justify-between text-xs font-medium text-ink-300">
                <span>{progress.xp} XP total</span>
                <span>{info.isMaxLevel ? 'Max level' : `${info.xpIntoLevel} / ${info.xpForNextLevel} to next level`}</span>
              </div>
              <ProgressBar value={info.percent} tone="volt" label={`${species.name} level progress`} />
            </div>
          )}
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-400">Evolution</h3>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STAGES.map((stage) => {
            const reached = unlocked && info.stage >= stage;
            return (
              <li
                key={stage}
                className={
                  reached
                    ? 'rounded-2xl border border-neon-400/40 bg-neon-500/10 p-4'
                    : 'rounded-2xl border border-white/10 bg-night-950/50 p-4 opacity-70'
                }
              >
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-400">
                  <span>Stage {stage}</span>
                  {reached ? <Check className="h-4 w-4 text-neon-300" /> : <Lock className="h-3.5 w-3.5" />}
                </div>
                <p className="mt-2 font-bold text-ink-50">{species.stageNames[stage - 1]}</p>
                <p className="mt-1 text-xs text-ink-300">{reached ? 'Unlocked' : `Reach level ${STAGE_START_LEVELS[stage]}`}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">Expenses in the {species.category} category feed this monster.</p>
        {isFeatured ? (
          <span className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
            <Star className="h-4 w-4 fill-amber-300" /> Featured on your dashboard
          </span>
        ) : (
          <Button variant="primary" size="sm" disabled={!unlocked} onClick={onFeature}>
            <Star className="h-4 w-4" /> Make featured
          </Button>
        )}
      </div>
    </div>
  );
}
