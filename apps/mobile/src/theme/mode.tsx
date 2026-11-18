import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The user's appearance choice: "auto" follows the phone, light/dark override it.
export type ThemeMode = 'auto' | 'light' | 'dark';
const KEY = 'petra_theme_mode';

/** Also tell the OS layer (dialogs, keyboard, system bars) where the platform supports it. */
export function applyThemeMode(mode: ThemeMode) {
  try {
    Appearance.setColorScheme(mode);
  } catch {
    /* unsupported platform: the in-app palette still follows the choice */
  }
}

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  applyThemeMode(mode);
  try {
    await AsyncStorage.setItem(KEY, mode);
  } catch {
    /* choice still applies for this session */
  }
}

const Ctx = createContext<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>({ mode: 'auto', setMode: () => {} });

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    loadThemeMode().then((m) => {
      setModeState(m);
      applyThemeMode(m);
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setThemeMode(m);
  }, []);

  return <Ctx.Provider value={{ mode, setMode }}>{children}</Ctx.Provider>;
}

export const useThemeMode = () => useContext(Ctx);

/** The scheme the UI should actually use: the user's choice, else the phone's. */
export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { mode } = useThemeMode();
  return mode === 'auto' ? (system === 'dark' ? 'dark' : 'light') : mode;
}
