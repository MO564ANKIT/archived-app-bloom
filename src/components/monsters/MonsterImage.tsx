import { useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { MonsterArt } from '@/components/monsters/MonsterArt';
import { cn } from '@/lib/cn';
import { MONSTER_IMAGE_SOURCES } from '@/lib/monsterAssets';
import { getSpecies, type Stage } from '@/lib/monsters';
import type { MonsterId } from '@/types';

interface MonsterImageProps {
  monsterId: MonsterId;
  stage: Stage;
  locked?: boolean;
  className?: string;
}

export function MonsterImage({ monsterId, stage, locked = false, className }: MonsterImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = MONSTER_IMAGE_SOURCES[monsterId];
  const species = getSpecies(monsterId);
  const src = sources[sourceIndex];

  if (!src) {
    return <MonsterArt id={monsterId} stage={stage} locked={locked} className={className} />;
  }

  const handleError = () => setSourceIndex((index) => index + 1);

  return (
    <div className={cn('relative flex h-full w-full items-center justify-center', className)}>
      <img
        key={src}
        src={src}
        alt={`${species.name}, ${species.stageNames[stage - 1]}`}
        loading="lazy"
        decoding="async"
        onError={handleError}
        className="h-full w-full object-contain transition-transform duration-500 ease-out hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
        style={{
          filter: locked ? 'grayscale(1) brightness(0.25) contrast(1.2)' : `drop-shadow(0 8px 16px ${species.color}55)`,
        }}
      />
      {stage >= 2 && <Sparkles aria-hidden className="absolute left-1 top-1 h-4 w-4 text-amber-300" />}
      {stage === 3 && <Crown aria-hidden className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 text-amber-300" />}
    </div>
  );
}
