import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MonsterImage } from '@/components/monsters/MonsterImage';
import type { Stage } from '@/lib/monsters';
import { cn } from '@/lib/cn';
import type { MonsterId } from '@/types';

type Flash = { kind: 'level' | 'evolve'; key: number };

const SIZE_CLASSES = {
  sm: 'h-24 w-24',
  md: 'h-40 w-40',
  lg: 'h-56 w-56',
} as const;

const BURST_ANGLES = Array.from({ length: 10 }, (_, index) => (index * 360) / 10);

interface MonsterStageProps {
  monsterId: MonsterId;
  level: number;
  stage: Stage;
  locked?: boolean;
  size?: keyof typeof SIZE_CLASSES;
}

export function MonsterStage({ monsterId, level, stage, locked = false, size = 'md' }: MonsterStageProps) {
  const [flash, setFlash] = useState<Flash | null>(null);
  const previous = useRef({ monsterId, level, stage });

  useEffect(() => {
    const prior = previous.current;
    previous.current = { monsterId, level, stage };
    if (prior.monsterId !== monsterId) return;
    if (stage > prior.stage) {
      setFlash({ kind: 'evolve', key: Date.now() });
    } else if (level > prior.level) {
      setFlash({ kind: 'level', key: Date.now() });
    }
  }, [monsterId, level, stage]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2400);
    return () => window.clearTimeout(timer);
  }, [flash]);

  return (
    <div className={cn('relative flex items-center justify-center', SIZE_CLASSES[size])}>
      <AnimatePresence>
        {flash && (
          <motion.div
            key={`ring-${flash.key}`}
            className="pointer-events-none absolute inset-4 rounded-full border-2 border-neon-400"
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
          />
        )}
        {flash &&
          BURST_ANGLES.map((angle) => (
            <motion.span
              key={`spark-${flash.key}-${angle}`}
              className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-neon-300 shadow-glow-neon"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((angle * Math.PI) / 180) * 84,
                y: Math.sin((angle * Math.PI) / 180) * 84,
                opacity: 0,
                scale: 0.3,
              }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      <motion.div
        className="h-full w-full"
        animate={locked ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          key={`${monsterId}-${stage}-${flash?.key ?? 0}`}
          className="h-full w-full"
          initial={flash ? { scale: 0.7, rotate: -6 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          <MonsterImage monsterId={monsterId} stage={stage} locked={locked} className="h-full w-full" />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={`label-${flash.key}`}
            className="pointer-events-none absolute -top-1 left-1/2 whitespace-nowrap rounded-full bg-neon-400 px-3 py-1 text-xs font-bold tracking-wide text-night-950 shadow-glow-neon"
            initial={{ opacity: 0, y: 12, x: '-50%', scale: 0.7 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -12, x: '-50%' }}
          >
            {flash.kind === 'evolve' ? 'EVOLVED!' : 'LEVEL UP!'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
