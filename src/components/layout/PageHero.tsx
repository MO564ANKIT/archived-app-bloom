import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

type Tone = 'neon' | 'amber' | 'aqua' | 'volt';

const EYEBROW_TONE: Record<Tone, string> = {
  neon: 'border-neon-400/40 bg-neon-500/10 text-neon-300',
  amber: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  aqua: 'border-aqua-400/40 bg-aqua-500/10 text-aqua-300',
  volt: 'border-volt-400/40 bg-volt-500/15 text-volt-300',
};

const GLOW_TONE: Record<Tone, string> = {
  neon: 'bg-neon-400/30',
  amber: 'bg-amber-400/30',
  aqua: 'bg-aqua-400/30',
  volt: 'bg-volt-400/40',
};

interface PageHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
  badge?: ReactNode;
  actions?: ReactNode;
  /** Image URL for the artwork, or a custom node (e.g. a monster). */
  art: string | ReactNode;
  artAlt?: string;
  /** Extra content shown beside the artwork on wide screens (e.g. a stat card). */
  aside?: ReactNode;
}

const SPARKS = [
  { className: 'left-[12%] top-[18%]', delay: 0 },
  { className: 'right-[8%] top-[70%]', delay: 0.8 },
  { className: 'left-[55%] top-[10%]', delay: 1.6 },
];

export function PageHero({ eyebrow, title, description, tone = 'neon', badge, actions, art, artAlt = '', aside }: PageHeroProps) {
  return (
    <header className="hero-panel px-5 py-6 sm:px-8 sm:py-8">
      <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 sm:gap-8">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                EYEBROW_TONE[tone],
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" aria-hidden />
              {eyebrow}
            </span>
            {badge}
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink-50 sm:text-4xl lg:text-5xl">{title}</h1>
          {description && <div className="max-w-2xl text-sm text-ink-300 sm:text-base">{description}</div>}
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </div>

        <div className="flex items-center gap-6">
          {aside && <div className="hidden lg:block">{aside}</div>}
          <div className="relative h-24 w-24 shrink-0 sm:h-36 sm:w-36 lg:h-44 lg:w-44">
            <div className={cn('absolute inset-2 rounded-full blur-2xl', GLOW_TONE[tone])} aria-hidden />
            {SPARKS.map((spark) => (
              <motion.span
                key={spark.className}
                aria-hidden
                className={cn('absolute h-1.5 w-1.5 rounded-full bg-ink-50', spark.className)}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.3, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: spark.delay }}
              />
            ))}
            <div className="relative h-full w-full animate-float motion-reduce:animate-none">
              {typeof art === 'string' ? (
                <img src={art} alt={artAlt} width={520} height={520} className="h-full w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]" />
              ) : (
                art
              )}
            </div>
          </div>
        </div>
      </div>
      {aside && <div className="relative mt-5 lg:hidden">{aside}</div>}
    </header>
  );
}
