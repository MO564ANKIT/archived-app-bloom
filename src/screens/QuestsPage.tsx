import { useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { AchievementGrid } from '@/components/quests/AchievementGrid';
import { QuestRow } from '@/components/quests/QuestRow';
import { Celebration } from '@/components/kit/Celebration';
import { getSpecies } from '@/lib/monsters';
import { QUESTS, countQuestProgress, questRecordKey, type QuestDefinition } from '@/lib/quests';
import { useGame } from '@/state/gameContext';

export function QuestsPage() {
  const { state, today, startQuest, claimQuest } = useGame();
  const [celebration, setCelebration] = useState<{ quest: string; reward: string } | null>(null);

  const rowsFor = (quest: QuestDefinition) => ({
    quest,
    progress: countQuestProgress(quest, state.events, today),
    record: state.quests[questRecordKey(quest.id, quest.period, today)] ?? null,
  });

  const daily = QUESTS.filter((quest) => quest.period === 'daily').map(rowsFor);
  const weekly = QUESTS.filter((quest) => quest.period === 'weekly').map(rowsFor);
  const completedToday = daily.filter((row) => row.record?.status === 'completed').length;
  const completedWeek = weekly.filter((row) => row.record?.status === 'completed').length;

  const handleClaim = (quest: QuestDefinition) => {
    claimQuest(quest.id);
    setCelebration({
      quest: quest.name,
      reward: `+${quest.rewardXp} XP for ${getSpecies(quest.rewardMonster).name}`,
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-neon-400">Quest board</p>
        <h1 className="mt-1 text-3xl font-bold text-ink-50 sm:text-4xl">Pick a quest. Finish it. Get XP.</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-300">
          Quests reward things you do: tracking, pausing, and skipping. Spending amounts never add or remove XP.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryTile label="Daily quests done today" value={`${completedToday} / ${daily.length}`} />
        <SummaryTile label="Weekly quests done this week" value={`${completedWeek} / ${weekly.length}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <QuestSection title="Daily quests" subtitle="Resets at midnight">
            {daily.map((row) => (
              <QuestRow
                key={row.quest.id}
                {...row}
                onStart={() => startQuest(row.quest.id)}
                onClaim={() => handleClaim(row.quest)}
              />
            ))}
          </QuestSection>
          <QuestSection title="Weekly quests" subtitle="Monday to Sunday">
            {weekly.map((row) => (
              <QuestRow
                key={row.quest.id}
                {...row}
                onStart={() => startQuest(row.quest.id)}
                onClaim={() => handleClaim(row.quest)}
              />
            ))}
          </QuestSection>
        </div>

        <aside className="space-y-6 xl:col-span-2">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-50">
              <Info className="h-5 w-5 text-aqua-300" /> How XP works
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-300">
              <li>Each logged expense gives 10 XP to the monster that matches its category.</li>
              <li>Claiming a quest gives the XP shown on that quest to its reward monster.</li>
              <li>Quests track actions and logging. They never reward or punish how much you spend.</li>
              <li>Monsters level up every few XP and evolve at levels 10 and 20.</li>
            </ul>
          </section>
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-ink-50">Achievements</h2>
            <AchievementGrid unlocked={state.achievements} />
          </section>
        </aside>
      </div>

      <Celebration
        open={celebration !== null}
        title="You did it!"
        message={celebration ? `${celebration.quest} is complete.` : ''}
        reward={celebration?.reward}
        onClose={() => setCelebration(null)}
      />
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card flex items-center justify-between p-5">
      <p className="text-sm font-medium text-ink-300">{label}</p>
      <p className="font-display text-2xl font-bold text-neon-300">{value}</p>
    </div>
  );
}

function QuestSection({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-ink-50">{title}</h2>
        <p className="text-xs text-ink-400">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
