import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, Row, Screen, Section } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { MODULES, MODULE_KEYS } from '@/training/content';
import { useTrainingProgress } from '@/training/progress';

export default function TrainingHub() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { completedCount, isDone } = useTrainingProgress();
  const pct = completedCount / MODULE_KEYS.length;

  return (
    <Screen>
      <LanguageSwitcher />
      <View style={{ gap: spacing.xs, paddingHorizontal: spacing.xs }}>
        <AppText variant="subhead" tone="secondary">
          {t('train.hub.subtitle')}
        </AppText>
        <AppText variant="footnote" weight="600" tone="tint">
          {t('train.hub.noAccount')}
        </AppText>
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AppText variant="headline">{t('train.hub.title')}</AppText>
          <AppText variant="headline" tone="tint" numeric>
            {completedCount} / {MODULE_KEYS.length}
          </AppText>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.fill, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: 8, borderRadius: 4, backgroundColor: colors.tint }} />
        </View>
        <AppText variant="footnote" tone="secondary">
          {completedCount} {t('train.hub.completed')}
        </AppText>
      </Card>

      <Section>
        {MODULE_KEYS.map((k) => {
          const m = MODULES[k];
          const done = isDone(k);
          return (
            <Row
              key={k}
              icon={m.icon}
              iconColor={done ? colors.success : colors.tint}
              title={t(`train.modules.${k}.t`)}
              subtitle={t(`train.modules.${k}.d`)}
              right={done ? <Icon name="checkCircle" size={20} color={colors.success} /> : undefined}
              chevron
              onPress={() => router.push(m.href)}
            />
          );
        })}
      </Section>

      <AppText variant="footnote" tone="secondary" style={{ paddingHorizontal: spacing.lg, textAlign: 'center' }}>
        {t('train.hub.notice')}
      </AppText>
    </Screen>
  );
}
