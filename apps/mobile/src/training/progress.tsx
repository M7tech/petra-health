import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MODULE_KEYS, ModuleKey } from './content';

// Learning progress lives only on the device (no account, nothing leaves the phone).
// Language changes never touch it: it is keyed by module, not by language.
const KEY = 'petra_training_v1';

interface Stored {
  /** Best quiz score per completed module (0..2). */
  done: Partial<Record<ModuleKey, number>>;
  /** Optional first-use date of the current pen (ISO yyyy-mm-dd), for the informational 8-week tracker. */
  firstUse: string | null;
  /** Optional expiry printed on the box: month (1-12) and year. The pen cannot be used after the last day of that month. */
  expiry: { year: number; month: number } | null;
}

interface Ctx extends Stored {
  completedCount: number;
  isDone: (k: ModuleKey) => boolean;
  markDone: (k: ModuleKey, score: number) => void;
  setFirstUse: (iso: string | null) => void;
  setExpiry: (e: { year: number; month: number } | null) => void;
}

const EMPTY: Stored = { done: {}, firstUse: null, expiry: null };
const ProgressContext = createContext<Ctx>({ ...EMPTY, completedCount: 0, isDone: () => false, markDone: () => {}, setFirstUse: () => {}, setExpiry: () => {} });

export function TrainingProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Stored>(EMPTY);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Stored) });
      })
      .catch(() => {});
  }, []);

  const save = useCallback((next: Stored) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const markDone = useCallback(
    (k: ModuleKey, score: number) => {
      setState((prev) => {
        const next = { ...prev, done: { ...prev.done, [k]: Math.max(prev.done[k] ?? 0, score) } };
        AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const setFirstUse = useCallback((iso: string | null) => save({ ...state, firstUse: iso }), [save, state]);
  const setExpiry = useCallback((expiry: { year: number; month: number } | null) => save({ ...state, expiry }), [save, state]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      completedCount: MODULE_KEYS.filter((k) => state.done[k] != null).length,
      isDone: (k) => state.done[k] != null,
      markDone,
      setFirstUse,
      setExpiry,
    }),
    [state, markDone, setFirstUse, setExpiry],
  );
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export const useTrainingProgress = () => useContext(ProgressContext);
