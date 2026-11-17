import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api';
import { AFTER8_KEY, After8, buildSchedule, dayKey } from './semetra';
import type { DoseLog, Hba1cEntry, Medication, UserMedication, WeightEntry } from '@/types';

/**
 * Loads on mount and again whenever the screen regains focus, keeping stale
 * data on screen while it refreshes — so tabs stay current after logging
 * elsewhere without a flash of loading.
 */
export function useFocusLoad(load: () => Promise<void>) {
  const first = useRef(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const run = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      try {
        await load();
      } finally {
        if (first.current) {
          first.current = false;
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [load],
  );
  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );
  return { loading, refreshing, refresh: () => run(true), reload: () => run() };
}

/** The Semetra course: catalogue, the patient's enrolment, logged doses and schedule. */
export function useSemetra() {
  const [catalog, setCatalog] = useState<Medication | null>(null);
  const [mine, setMine] = useState<UserMedication | null>(null);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [after8Stored, setAfter8Stored] = useState<After8 | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AFTER8_KEY)
      .then((v) => {
        if (v === '0.5' || v === '1') setAfter8Stored(v);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cat, meds] = await Promise.all([api<Medication[]>('/medications'), api<UserMedication[]>('/me/medications')]);
      setCatalog(cat.find((m) => m.name === 'Semetra') ?? cat[0] ?? null);
      const enrolled = meds.find((m) => m.name === 'Semetra' && m.active) ?? null;
      setMine(enrolled);
      setDoses(enrolled ? await api<DoseLog[]>(`/me/doses?userMedicationId=${enrolled.id}`) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  const state = useFocusLoad(load);

  // The doctor's choice if set, otherwise inferred from any 1 mg dose already logged.
  const after8: After8 = after8Stored ?? (doses.some((d) => (d.doseMg ?? 0) >= 1) ? '1' : '0.5');
  const setAfter8 = useCallback((v: After8) => {
    setAfter8Stored(v);
    AsyncStorage.setItem(AFTER8_KEY, v).catch(() => {});
  }, []);

  const blocks = useMemo(() => buildSchedule(catalog, mine, after8), [catalog, mine, after8]);
  const flat = useMemo(() => blocks.flatMap((b) => b.weeks), [blocks]);
  const takenKeys = useMemo(() => new Set(doses.map((d) => dayKey(d.scheduledFor))), [doses]);
  const hasStepUpPen = !!catalog?.pens.some((p) => p.sequence === 3);

  const logDose = useCallback(
    async (date: Date, doseMg: number) => {
      if (!mine) return;
      const key = dayKey(date.toISOString());
      if (takenKeys.has(key)) return;
      await api('/me/doses', {
        method: 'POST',
        body: JSON.stringify({ userMedicationId: mine.id, scheduledFor: date.toISOString(), doseMg }),
      });
      setDoses((prev) => [
        ...prev,
        { id: key, userMedicationId: mine.id, scheduledFor: date.toISOString(), takenAt: new Date().toISOString(), doseMg },
      ]);
    },
    [mine, takenKeys],
  );

  return { catalog, mine, doses, error, after8, setAfter8, blocks, flat, takenKeys, hasStepUpPen, logDose, ...state };
}

/** Weight + HbA1c history, newest data kept fresh on focus. */
export function useMetrics() {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [hba1c, setHba1c] = useState<Hba1cEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [w, h] = await Promise.all([api<WeightEntry[]>('/me/weights'), api<Hba1cEntry[]>('/me/hba1c')]);
      setWeights(w);
      setHba1c(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  const state = useFocusLoad(load);
  return { weights, hba1c, error, ...state };
}
