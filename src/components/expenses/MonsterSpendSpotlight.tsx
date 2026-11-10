import { Sparkles } from 'lucide-react';
import { MonsterImage } from '@/components/monsters/MonsterImage';
import { CATEGORY_META } from '@/lib/categories';
import type { MonthSummary } from '@/lib/finance';
import { formatMoney } from '@/lib/money';
import { getLevelProgress, MONSTER_SPECIES, monsterForCategory } from '@/lib/monsters';
import type { MonsterId, MonsterProgress } from '@/types';

interface MonsterSpendSpotlightProps {
  summary: MonthSummary;
  monsters: Record<MonsterId, MonsterProgress>;
}

export function MonsterSpendSpotlight({ summary, monsters }: MonsterSpendSpotlightProps) {
  const fed = summary.categories
    .filter((entry) => entry.spentPaise > 0)
    .map((entry) => ({ entry, species: monsterForCategory(entry.category) }))
    .filter((item): item is { entry: typeof item.entry; species: NonNullable<typeof item.species> } => item.species !== null);

  const top = fed[0] ?? null;
  const stageOf = (id: MonsterId) => getLevelProgress(monsters[id]?.xp ?? 0).stage;

  if (!top) {
    const saverion = MONSTER_SPECIES.find((species) => species.id === 'saverion')!;
    return (
      <section className="card relative overflow-hidden p-6 text-center">
        <div className="mx-auto h-36 w-36">
          <MonsterImage monsterId={saverion.id} stage={stageOf(saverion.id)} />
        </div>
        <h2 className="mt-3 text-lg font-bold text-ink-50">Quiet month so far</h2>
        <p className="mt-1 text-sm text-ink-300">Log an expense and the matching monster will start growing.</p>
      </section>
    );
  }

  const { entry, species } = top;
  const status =
    entry.remainingPaise === null
      ? 'No limit set for this category'
      : entry.remainingPaise < 0
        ? `${formatMoney(-entry.remainingPaise)} over the limit`
        : `${formatMoney(entry.remainingPaise)} left in this category`;
  const over = entry.remainingPaise !== null && entry.remainingPaise < 0;

  return (
    <section className="card relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-30 blur-3xl"
        style={{ background: species.color }}
      />
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-neon-300">
        <Sparkles className="h-3.5 w-3.5" /> Monster spotlight
      </p>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-28 w-28 shrink-0 animate-float motion-reduce:animate-none">
          <MonsterImage monsterId={species.id} stage={stageOf(species.id)} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-ink-50">{species.name}</h2>
          <p className="text-sm text-ink-300">
            is feasting on your <span className="font-semibold text-ink-100">{CATEGORY_META[entry.category].label}</span>
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{formatMoney(entry.spentPaise)}</p>
          <p className={over ? 'text-xs font-semibold text-red-300' : 'text-xs text-ink-400'}>{status}</p>
        </div>
      </div>
      <p className="mt-4 rounded-xl border border-white/10 bg-night-950/50 p-3 text-xs italic text-ink-300">
        “{species.personality}”
      </p>

      {fed.length > 1 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-400">Also growing this month</p>
          <ul className="grid grid-cols-4 gap-2">
            {fed.slice(1, 5).map(({ entry: other, species: monster }) => (
              <li
                key={monster.id}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-night-950/50 p-2 text-center"
              >
                <div className="h-14 w-14">
                  <MonsterImage monsterId={monster.id} stage={stageOf(monster.id)} />
                </div>
                <span className="mt-1 truncate text-[11px] font-semibold text-ink-100">{monster.name}</span>
                <span className="text-[11px] text-ink-400">{formatMoney(other.spentPaise)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
