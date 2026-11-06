import { motion } from 'framer-motion';
import type { Tone } from '@/components/kit/ProgressBar';
import { cn } from '@/lib/cn';

const STROKE: Record<Tone, string> = {
  neon: 'text-neon-400',
  volt: 'text-volt-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  aqua: 'text-aqua-400',
};

interface ProgressRingProps {
  value: number;
  tone?: Tone;
  size?: number;
  label: string;
}

export function ProgressRing({ value, tone = 'neon', size = 88, label }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
      className={cn('relative shrink-0', STROKE[tone])}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 drop-shadow-[0_0_8px_currentColor]" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold text-ink-50">
        {Math.round(clamped)}%
      </div>
    </div>
  );
}
