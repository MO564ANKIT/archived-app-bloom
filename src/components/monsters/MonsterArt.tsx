import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { getSpecies } from '@/lib/monsters';
import type { Stage } from '@/lib/monsters';
import type { MonsterId } from '@/types';

interface DrawingProps {
  color: string;
}

function Shopzilla({ color }: DrawingProps) {
  return (
    <>
      <polygon points="28,48 12,26 38,38" fill={color} />
      <polygon points="92,48 108,26 82,38" fill={color} />
      <ellipse cx="60" cy="68" rx="36" ry="32" fill={color} />
      <ellipse cx="60" cy="82" rx="20" ry="13" fill="#ffe0b8" opacity="0.5" />
      <circle cx="46" cy="60" r="8" fill="#faf9ff" />
      <circle cx="74" cy="60" r="8" fill="#faf9ff" />
      <circle cx="48" cy="61" r="3.8" fill="#0f0819" />
      <circle cx="76" cy="61" r="3.8" fill="#0f0819" />
      <path d="M36 48 L52 53 M84 48 L68 53" stroke="#3b1a05" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 84 Q60 96 74 84" stroke="#3b1a05" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 80 Q95 64 102 80" stroke="#6ee6ff" strokeWidth="3" fill="none" />
      <rect x="84" y="80" width="24" height="24" rx="4" fill="#6ee6ff" />
      <path d="M90 88 h12" stroke="#0f0819" strokeWidth="2" opacity="0.4" />
    </>
  );
}

function Coffeeling({ color }: DrawingProps) {
  return (
    <>
      <path d="M44 22 q-6 -8 0 -16 M60 18 q-6 -8 0 -16 M76 22 q-6 -8 0 -16" stroke="#eee9fa" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75" />
      <rect x="24" y="34" width="72" height="66" rx="32" fill={color} />
      <ellipse cx="22" cy="74" rx="6" ry="10" fill={color} />
      <ellipse cx="98" cy="74" rx="6" ry="10" fill={color} />
      <circle cx="46" cy="62" r="10" fill="#faf9ff" />
      <circle cx="74" cy="62" r="10" fill="#faf9ff" />
      <circle cx="48" cy="63" r="4.5" fill="#2a1406" />
      <circle cx="76" cy="63" r="4.5" fill="#2a1406" />
      <circle cx="49.5" cy="61.5" r="1.4" fill="#faf9ff" />
      <circle cx="77.5" cy="61.5" r="1.4" fill="#faf9ff" />
      <circle cx="36" cy="78" r="5" fill="#ff7a9c" opacity="0.45" />
      <circle cx="84" cy="78" r="5" fill="#ff7a9c" opacity="0.45" />
      <ellipse cx="60" cy="84" rx="9" ry="7" fill="#2a1406" />
    </>
  );
}

function Munchlord({ color }: DrawingProps) {
  return (
    <>
      <circle cx="60" cy="28" r="7" fill="#ff3d5a" />
      <path d="M60 21 q4 -8 10 -6" stroke="#33f58b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="66" r="36" fill={color} />
      <path d="M30 40 L50 46 M90 40 L70 46" stroke="#3b0d1c" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="44" cy="54" rx="9" ry="7" fill="#faf9ff" />
      <ellipse cx="76" cy="54" rx="9" ry="7" fill="#faf9ff" />
      <circle cx="46" cy="55" r="3.5" fill="#3b0d1c" />
      <circle cx="78" cy="55" r="3.5" fill="#3b0d1c" />
      <ellipse cx="60" cy="84" rx="26" ry="16" fill="#3b0d1c" />
      <path d="M38 74 l5 8 l5 -8 l5 8 l5 -8 l5 8 l5 -8 l5 8 l5 -8" stroke="#faf9ff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    </>
  );
}

function Saverion({ color }: DrawingProps) {
  return (
    <>
      <polygon points="26,58 6,34 14,72" fill="#b5ffd3" opacity="0.55" />
      <polygon points="94,58 114,34 106,72" fill="#b5ffd3" opacity="0.55" />
      <path d="M60 110 Q92 110 98 92" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      <polygon points="60,20 92,54 84,100 60,110 36,100 28,54" fill={color} />
      <path d="M60 20 L60 110 M28 54 L92 54" stroke="#faf9ff" strokeWidth="1.5" opacity="0.3" />
      <polygon points="46,30 42,12 56,26" fill="#b5ffd3" />
      <polygon points="74,30 78,12 64,26" fill="#b5ffd3" />
      <ellipse cx="50" cy="62" rx="5" ry="7" fill="#08040f" />
      <ellipse cx="70" cy="62" rx="5" ry="7" fill="#08040f" />
      <circle cx="51.5" cy="59.5" r="2" fill="#faf9ff" />
      <circle cx="71.5" cy="59.5" r="2" fill="#faf9ff" />
      <path d="M52 80 Q60 86 68 80" stroke="#08040f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  );
}

function Napcoin({ color }: DrawingProps) {
  return (
    <>
      <circle cx="60" cy="62" r="38" fill={color} />
      <circle cx="60" cy="62" r="32" fill="none" stroke="#b07a10" strokeWidth="3" strokeDasharray="5 4" />
      <text x="60" y="76" textAnchor="middle" fontSize="30" fontWeight="700" fill="#8a5a00" fontFamily="Space Grotesk, sans-serif">
        ₹
      </text>
      <path d="M38 58 Q44 64 50 58 M70 58 Q76 64 82 58" stroke="#3b2600" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M56 82 Q60 85 64 82" stroke="#3b2600" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text x="96" y="30" fontSize="13" fontWeight="700" fill="#b4a9d3">z</text>
      <text x="104" y="18" fontSize="10" fontWeight="700" fill="#b4a9d3">z</text>
    </>
  );
}

function Impulso({ color }: DrawingProps) {
  return (
    <>
      <path
        d="M24 88 C18 60 28 30 60 30 C92 30 104 60 96 88 C92 104 80 106 72 98 C66 104 56 104 50 98 C42 106 28 104 24 88 Z"
        fill={color}
        opacity="0.92"
      />
      <ellipse cx="44" cy="46" rx="8" ry="5" fill="#faf9ff" opacity="0.5" />
      <circle cx="48" cy="64" r="9" fill="#faf9ff" />
      <circle cx="74" cy="64" r="9" fill="#faf9ff" />
      <circle cx="50" cy="66" r="4.5" fill="#2a0a40" />
      <circle cx="76" cy="62" r="4.5" fill="#2a0a40" />
      <path d="M48 82 Q60 96 74 82 Z" fill="#2a0a40" />
      <path d="M100 26 L92 40 L100 40 L94 54" stroke="#6ee6ff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M14 34 L22 46 L14 46 L20 56" stroke="#6ee6ff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
    </>
  );
}

const DRAWINGS: Record<MonsterId, (props: DrawingProps) => ReactNode> = {
  shopzilla: Shopzilla,
  coffeeling: Coffeeling,
  munchlord: Munchlord,
  saverion: Saverion,
  napcoin: Napcoin,
  impulso: Impulso,
};

const STAGE_SCALE = { 1: 0.84, 2: 0.95, 3: 1.04 } as const;

function Sparkles() {
  return (
    <g fill="#ffe08a">
      <path d="M14 14 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" />
      <path d="M106 96 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" />
    </g>
  );
}

function Crown() {
  return <path d="M40 16 L47 3 L60 12 L73 3 L80 16 Z" fill="#ffc54d" stroke="#8a5a00" strokeWidth="1.5" strokeLinejoin="round" />;
}

interface MonsterArtProps {
  id: MonsterId;
  stage: Stage;
  locked?: boolean;
  className?: string;
}

export function MonsterArt({ id, stage, locked = false, className }: MonsterArtProps) {
  const species = getSpecies(id);
  const Drawing = DRAWINGS[id];
  const scale = STAGE_SCALE[stage];
  const aura = `aura-${id}`;

  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${species.name}, ${species.stageNames[stage - 1]}`}
      className={cn('overflow-visible', className)}
      style={{ filter: locked ? 'grayscale(1) brightness(0.25) contrast(1.2)' : `drop-shadow(0 8px 16px ${species.color}55)` }}
    >
      <defs>
        <radialGradient id={aura}>
          <stop offset="0%" stopColor={species.color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={species.color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {stage === 3 && <circle cx="60" cy="60" r="60" fill={`url(#${aura})`} />}
      <g transform={`translate(60 62) scale(${scale}) translate(-60 -62)`}>
        <Drawing color={species.color} />
      </g>
      {stage >= 2 && <Sparkles />}
      {stage === 3 && <Crown />}
    </svg>
  );
}
