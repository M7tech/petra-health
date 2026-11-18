import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18n } from 'i18n-js';
import { translations } from './translations';

export type Lang = 'en' | 'ar' | 'ku';
const RTL_LANGS: Lang[] = ['ar', 'ku'];
const STORAGE_KEY = 'petra_lang';

// Real RTL: layout direction is owned by the OS-level I18nManager, so native
// headers, tab bars, sheets and back gestures all mirror — not just our views.
I18nManager.allowRTL(true);

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

function deviceLang(): Lang {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  if (code === 'ar') return 'ar';
  if (code === 'ku' || code === 'ckb') return 'ku';
  return 'en';
}

const wantsRTL = (l: Lang) => RTL_LANGS.includes(l);

/** BCP-47 locale for the in-app language (not the device's), for dates and numbers. */
export const currentLocale = () => ({ en: 'en', ar: 'ar', ku: 'ckb' })[i18n.locale as Lang] ?? 'en';

/** Reload the JS runtime so a changed layout direction takes effect. */
export async function restartApp(): Promise<boolean> {
  try {
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}

interface Ctx {
  lang: Lang;
  /** The layout direction actually in effect (follows I18nManager). */
  isRTL: boolean;
  /** True when the chosen language needs a restart to flip the layout. */
  needsRestart: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Resolves true when the layout direction must change (restart needed). */
  setLang: (l: Lang) => Promise<boolean>;
  ready: boolean;
}

const LanguageContext = createContext<Ctx>({
  lang: 'en',
  isRTL: false,
  needsRestart: false,
  t: (k) => k,
  setLang: async () => false,
  ready: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [ready, setReady] = useState(false);

  const apply = (l: Lang) => {
    i18n.locale = l;
    setLangState(l);
    // Persist the direction for the next cold start. Takes effect after reload.
    if (I18nManager.isRTL !== wantsRTL(l)) I18nManager.forceRTL(wantsRTL(l));
  };

  useEffect(() => {
    (async () => {
      const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
      const l = stored ?? deviceLang();
      apply(l);
      setReady(true);
      // First launch in an RTL language: flip the layout once.
      if (I18nManager.isRTL !== wantsRTL(l)) restartApp();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    await AsyncStorage.setItem(STORAGE_KEY, l);
    apply(l);
    return I18nManager.isRTL !== wantsRTL(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recreate t on each lang change so components re-render with new strings.
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => i18n.t(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  return (
    <LanguageContext.Provider
      value={{ lang, isRTL: I18nManager.isRTL, needsRestart: I18nManager.isRTL !== wantsRTL(lang), t, setLang, ready }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useI18n = () => useContext(LanguageContext);

/** Translate outside React (e.g. when scheduling a notification) in the language the user chose. */
export const tr = (key: string): string => i18n.t(key);
