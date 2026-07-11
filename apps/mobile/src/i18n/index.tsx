import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';
import { translations } from './translations';

export type Lang = 'en' | 'ar' | 'ku';
const RTL_LANGS: Lang[] = ['ar', 'ku'];
const STORAGE_KEY = 'petra_lang';

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function deviceLang(): Lang {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ar') return 'ar';
  if (code === 'ku' || code === 'ckb') return 'ku';
  return 'en';
}

interface Ctx {
  lang: Lang;
  isRTL: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  setLang: (l: Lang) => void;
  ready: boolean;
}

const LanguageContext = createContext<Ctx>({
  lang: 'en',
  isRTL: false,
  t: (k) => k,
  setLang: () => {},
  ready: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ready, setReady] = useState(false);

  const apply = (l: Lang) => {
    i18n.locale = l;
    setLangState(l);
  };

  useEffect(() => {
    (async () => {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
      apply(stored ?? deviceLang());
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, l);
    apply(l);
  }, []);

  // Recreate t on each lang change so components re-render with new strings.
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, isRTL: RTL_LANGS.includes(lang), t, setLang, ready }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useI18n = () => useContext(LanguageContext);
