import { MAX_LEVEL, STAGE_START_LEVELS, stageName, type MonsterSpecies, type Stage } from '@/lib/monsters';

const STAGES: Stage[] = [1, 2, 3];

function levelToFraction(level: number): number {
  return (level - 1) / (MAX_LEVEL - 1);
}

interface EvolutionTrackProps {
  species: MonsterSpecies;
  level: number;
  stage: Stage;
  unlocked: boolean;
}

export function EvolutionTrack({ species, level, stage, unlocked }: EvolutionTrackProps) {
  const fill = unlocked ? levelToFraction(level) * 100 : 0;

  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-white/10" role="presentation">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${fill}%`, background: `linear-gradient(90deg, ${species.color}, #bef264)` }}
        />
        {STAGES.slice(1).map((next) => (
          <span
            key={next}
            className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-night-950"
            style={{ left: `${levelToFraction(STAGE_START_LEVELS[next]) * 100}%` }}
          />
        ))}
      </div>
      <ol className="mt-2 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-wider">
        {STAGES.map((item) => {
          const reached = unlocked && stage >= item;
          return (
            <li key={item} className={reached ? 'truncate text-lime-300' : 'truncate text-ink-400'}>
              {reached ? stageName(species.id, item) : `Lv ${STAGE_START_LEVELS[item]}`}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
