import React from 'react';
import { Alert } from 'react-native';
import { useI18n, restartApp, Lang } from '@/i18n';
import { SegmentedControl } from '@/components/ui';

const OPTIONS: { key: Lang; label: string }[] = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
  { key: 'ku', label: 'کوردی' },
];

// Switching between LTR (English) and RTL (Arabic / Kurdish) changes the
// layout direction, which the OS applies on the next launch — so we offer an
// immediate restart. Arabic <-> Kurdish needs none.
export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <SegmentedControl
      value={lang}
      options={OPTIONS}
      onChange={async (key) => {
        const needsRestart = await setLang(key);
        if (!needsRestart) return;
        Alert.alert(t('ui.restartTitle'), t('ui.restartBody'), [
          { text: t('ui.later'), style: 'cancel' },
          {
            text: t('ui.restartNow'),
            // If an automatic reload isn't possible, ask for a manual restart.
            onPress: async () => {
              if (!(await restartApp())) Alert.alert(t('ui.restartTitle'), t('ui.restartBody'));
            },
          },
        ]);
      }}
    />
  );
}
