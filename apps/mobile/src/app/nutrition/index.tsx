import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, IconName, Row, Screen, Section } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Image } from 'expo-image';
import { Disclaimer, Photo } from '@/nutrition/ui';

const PLATE = require('../../../assets/nutrition/plate.webp');

const PAGES: { key: 'plate' | 'foods' | 'daily' | 'comfort' | 'week' | 'sources'; icon: IconName; href: string }[] = [
  { key: 'plate', icon: 'fork', href: '/nutrition/plate' },
  { key: 'foods', icon: 'heart', href: '/nutrition/foods' },
  { key: 'daily', icon: 'walk', href: '/nutrition/daily' },
  { key: 'comfort', icon: 'bed', href: '/nutrition/comfort' },
  { key: 'week', icon: 'calendar', href: '/nutrition/week' },
  { key: 'sources', icon: 'book', href: '/nutrition/sources' },
];

export default function NutritionHub() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <LanguageSwitcher />
      <Card style={{ alignItems: 'center', gap: spacing.md, overflow: 'hidden' }}>
        <Photo id="plate" height={160} label={t('nutri.pages.plate.t')} />
        <Image source={PLATE} accessibilityLabel={t('nutri.pages.plate.t')} contentFit="contain" style={{ width: '100%', aspectRatio: 1.9 }} />
        <View style={{ gap: spacing.xs, alignItems: 'center' }}>
          <AppText variant="title2" weight="700" style={{ textAlign: 'center' }}>
            {t('nutri.hub.title')}
          </AppText>
          <AppText variant="subhead" tone="secondary" style={{ textAlign: 'center' }}>
            {t('nutri.hub.subtitle')}
          </AppText>
          <AppText variant="footnote" weight="600" tone="tint">
            {t('nutri.hub.noAccount')}
          </AppText>
        </View>
      </Card>

      <Section>
        {PAGES.map((p) => (
          <Row key={p.key} icon={p.icon} iconColor={colors.tint} title={t(`nutri.pages.${p.key}.t`)} subtitle={t(`nutri.pages.${p.key}.d`)} chevron onPress={() => router.push(p.href as never)} />
        ))}
      </Section>

      <Disclaimer />
      <AppText variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
        {t('nutri.hub.review')}
      </AppText>
    </Screen>
  );
}
