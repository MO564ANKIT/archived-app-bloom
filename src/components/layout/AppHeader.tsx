import { Database, Flame, LogOut, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/kit/Button';
import { Modal } from '@/components/kit/Modal';
import { useAuth } from '@/state/authContext';
import { useGame } from '@/state/gameContext';
import type { GameState } from '@/types';
import { computeStreak } from '@/lib/progress';

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neon-400/50 bg-night-900 shadow-glow-neon">
        <Flame className="h-5 w-5 text-neon-300" strokeWidth={2.25} />
      </div>
      <div className="leading-none">
        <p className="font-display text-xl font-bold uppercase tracking-[0.18em] text-ink-50">Spendemon</p>
        <p className="mt-1 hidden text-[11px] uppercase tracking-widest text-ink-400 sm:block">
          Your wallet is cooked. Your monsters are thriving.
        </p>
      </div>
    </div>
  );
}

interface AppHeaderProps {
  onNavigate: (page: 'dashboard') => void;
}

export function AppHeader({ onNavigate }: AppHeaderProps) {
  const { state, today } = useGame();
  const streak = computeStreak(state.events, today);

  return (
    <header className="sticky top-0 z-30 border-b border-neon-400/15 bg-night-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button type="button" onClick={() => onNavigate('dashboard')} className="rounded-xl text-left transition hover:opacity-90">
          <Logo />
        </button>
        <div className="flex items-center gap-2">
          <StreakChip streak={streak} />
          <DataMenu state={state} />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Sign out">
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  );
}

function StreakChip({ streak }: { streak: number }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-300"
      title="Consecutive days with any activity"
    >
      <Flame className={`h-4 w-4 ${streak > 0 ? 'animate-pulse' : 'opacity-50'}`} />
      <span>{streak}</span>
      <span className="hidden font-medium text-amber-200/80 sm:inline">day streak</span>
    </div>
  );
}

function DataMenu({ state }: { state: GameState }) {
  const { resetDemo, clearAll } = useGame();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<'reset' | 'clear' | null>(null);
  const sampleCount = state.expenses.filter((expense) => expense.isSample).length;

  const runConfirmed = () => {
    if (confirm === 'reset') resetDemo();
    if (confirm === 'clear') clearAll();
    setConfirm(null);
    setOpen(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="Data options">
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">Data</span>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Demo data" description="Your progress is saved to your account on every change.">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-night-950/60 p-4 text-sm text-ink-200">
            {sampleCount > 0
              ? `${sampleCount} sample expenses are marked SAMPLE. Real entries you add are never labelled that way.`
              : 'No sample expenses are currently loaded.'}
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setConfirm('reset')}>
            <RotateCcw className="h-4 w-4" /> Reset to demo data
          </Button>
          <Button variant="danger" className="w-full justify-start" onClick={() => setConfirm('clear')}>
            <Trash2 className="h-4 w-4" /> Clear all data
          </Button>
        </div>
        {confirm && (
          <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
            <p className="text-sm text-rose-100">
              {confirm === 'reset'
                ? 'This replaces your expenses, budgets, monsters, and quests with the demo set.'
                : 'This removes every expense, budget, monster level, and quest. It cannot be undone from here.'}
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" size="sm" onClick={runConfirmed}>
                Yes, continue
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
