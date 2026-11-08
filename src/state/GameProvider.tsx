import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { gameReducer } from '@/state/gameReducer';
import { GameContext, type ExpenseInput, type GameContextValue, type SyncStatus } from '@/state/gameContext';
import { savePlayerState, SaveConflictError } from '@/lib/persistence';
import { dateKey } from '@/lib/dates';
import type { Expense, GameState } from '@/types';

const SAVE_DELAY_MS = 600;

interface GameProviderProps {
  userId: string;
  initialState: GameState;
  initialVersion: number;
  children: ReactNode;
}

export function GameProvider({ userId, initialState, initialVersion, children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('ok');
  const versionRef = useRef(initialVersion);
  const conflictRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingRef = useRef<GameState | null>(null);

  const persist = useCallback(
    (snapshot: GameState) => {
      queueRef.current = queueRef.current.then(async () => {
        if (conflictRef.current) return;
        try {
          versionRef.current = await savePlayerState(userId, snapshot, versionRef.current);
          setSyncStatus('ok');
        } catch (err) {
          if (err instanceof SaveConflictError) {
            conflictRef.current = true;
            setSyncStatus('conflict');
          } else {
            setSyncStatus('error');
          }
        }
      });
    },
    [userId],
  );

  useEffect(() => {
    pendingRef.current = state;
    const timer = window.setTimeout(() => {
      pendingRef.current = null;
      persist(state);
    }, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state, persist]);

  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (pending) persist(pending);
    },
    [persist],
  );

  const value = useMemo<GameContextValue>(() => {
    const now = () => new Date().toISOString();
    return {
      state,
      today: dateKey(new Date()),
      syncStatus,
      addExpense: (input: ExpenseInput) =>
        dispatch({
          type: 'addExpense',
          at: now(),
          expense: {
            ...input,
            id: crypto.randomUUID(),
            isSample: false,
            createdAt: now(),
          } satisfies Expense,
        }),
      updateExpense: (id, input) => dispatch({ type: 'updateExpense', id, at: now(), patch: input }),
      deleteExpense: (id) => dispatch({ type: 'deleteExpense', id, at: now() }),
      saveBudgets: (monthlyBudgetPaise, categoryBudgetsPaise) =>
        dispatch({ type: 'saveBudgets', at: now(), monthlyBudgetPaise, categoryBudgetsPaise }),
      recordEvent: (eventType) => dispatch({ type: 'recordEvent', at: now(), eventType }),
      saveForLater: (itemIds) => dispatch({ type: 'saveForLater', at: now(), itemIds }),
      removeFromWishlist: (itemId) => dispatch({ type: 'removeFromWishlist', at: now(), itemId }),
      claimRewards: (rewards) => dispatch({ type: 'claimRewards', at: now(), rewards }),
      startQuest: (questId) => dispatch({ type: 'startQuest', at: now(), questId }),
      claimQuest: (questId) => dispatch({ type: 'claimQuest', at: now(), questId }),
      setFeatured: (monsterId) => dispatch({ type: 'setFeatured', at: now(), monsterId }),
      resetDemo: () => dispatch({ type: 'resetDemo', at: now() }),
      clearSampleData: () => dispatch({ type: 'clearSampleData', at: now() }),
      clearAll: () => dispatch({ type: 'clearAll', at: now() }),
    };
  }, [state, syncStatus]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
