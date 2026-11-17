import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api';

interface AppConfig {
  /** Seeing a doctor and chatting with them — switched on/off by the admin. */
  doctorFeatures: boolean;
}

const KEY = 'petra.config.v1';
const Ctx = createContext<AppConfig>({ doctorFeatures: true });

// Reads the server switch at launch and whenever the app returns to the
// foreground. The last value is cached so an offline launch behaves the same.
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>({ doctorFeatures: true });

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && alive && setConfig(JSON.parse(raw)))
      .catch(() => {});
    const refresh = () =>
      api<AppConfig>('/config')
        .then((c) => {
          if (!alive) return;
          setConfig({ doctorFeatures: !!c.doctorFeatures });
          AsyncStorage.setItem(KEY, JSON.stringify({ doctorFeatures: !!c.doctorFeatures })).catch(() => {});
        })
        .catch(() => {});
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return <Ctx.Provider value={config}>{children}</Ctx.Provider>;
}

export const useConfig = () => useContext(Ctx);
