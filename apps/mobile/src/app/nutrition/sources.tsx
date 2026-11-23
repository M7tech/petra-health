import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Screen } from '@/components/ui';
import { Disclaimer, Notice, PageHead } from '@/nutrition/ui';

export default function SourcesPage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <PageHead title={t('nutri.sources.title')} />
      <Card style={{ gap: spacing.lg }}>
        {['r1', 'r2', 'r3', 'r4'].map((k, n) => (
          <View key={k} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
            <View style={{ width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.tintSoft, alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="footnote" weight="700" tone="tint" numeric>
                {n + 1}
              </AppText>
            </View>
            <AppText variant="subhead" style={{ flex: 1 }} selectable>
              {t(`nutri.sources.${k}`)}
            </AppText>
          </View>
        ))}
      </Card>
      <Notice icon="info">
        <AppText variant="headline">{t('nutri.sources.noteT')}</AppText>
        <AppText variant="subhead">{t('nutri.sources.noteD')}</AppText>
      </Notice>
      <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center' }}>
        {t('nutri.sources.date')}
      </AppText>
      <Disclaimer />
    </Screen>
  );
}
