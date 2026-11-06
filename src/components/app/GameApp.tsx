import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from '@tanstack/react-router';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PaypalReturn } from '@/components/checkout/PaypalReturn';
import { MilestoneSync } from '@/components/checkout/MilestoneSync';
import { Button } from '@/components/kit/Button';
import { usePageNavigate } from '@/components/app/usePageNavigate';
import { useAuth } from '@/state/authContext';
import { GameProvider } from '@/state/GameProvider';
import { useGame } from '@/state/gameContext';
import { loadPlayerState, type LoadedPlayerState } from '@/lib/persistence';
import { finalizeState } from '@/lib/progress';
import { pageFromPath } from '@/lib/pageRoutes';

function AppShell({ children }: { children: ReactNode }) {
  const { syncStatus } = useGame();
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = usePageNavigate();

  return (
    <div className="min-h-screen text-ink-100">
      <AppHeader onNavigate={navigate} />
      {syncStatus !== 'ok' && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-rose-400/30 bg-rose-500/15 px-4 py-2 text-center text-sm text-rose-300">
          <p>
            {syncStatus === 'conflict'
              ? 'Your progress was updated in another tab or on another device, so changes here are paused to protect it.'
              : 'Your latest changes could not be saved. Check your connection; we will retry with your next change.'}
          </p>
          {syncStatus === 'conflict' && (
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Reload
            </Button>
          )}
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 sm:pt-10">
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {children}
        </motion.div>
      </main>
      <BottomNav page={pageFromPath(pathname)} onNavigate={navigate} />
      <PaypalReturn />
      <MilestoneSync />
    </div>
  );
}

export function StatusScreen({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-ink-200" role="status">
      <p>{message}</p>
      {children}
    </div>
  );
}

function PlayerGame({ userId, children }: { userId: string; children: ReactNode }) {
  const [loaded, setLoaded] = useState<LoadedPlayerState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoaded(null);
    loadPlayerState(userId, new Date()).then(
      (result) => {
        if (active) setLoaded({ ...result, state: finalizeState(result.state, new Date().toISOString()) });
      },
      (err: unknown) => {
        if (active) setLoadError(err instanceof Error ? err.message : 'Your progress could not be loaded.');
      },
    );
    return () => {
      active = false;
    };
  }, [userId, attempt]);

  if (loadError) {
    return (
      <StatusScreen message={loadError}>
        <Button
          variant="primary"
          onClick={() => {
            setLoadError(null);
            setAttempt((count) => count + 1);
          }}
        >
          Try again
        </Button>
      </StatusScreen>
    );
  }

  if (!loaded) return <StatusScreen message="Loading your progress..." />;

  return (
    <GameProvider key={userId} userId={userId} initialState={loaded.state} initialVersion={loaded.version}>
      <AppShell>{children}</AppShell>
    </GameProvider>
  );
}

/** Gates every game page: shows sign-in when signed out, then loads the player's save. */
export function GameGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <StatusScreen message="Loading..." />;
  if (!session) return <AuthScreen />;
  return <PlayerGame userId={session.user.id}>{children}</PlayerGame>;
}
