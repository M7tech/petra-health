import React from 'react';
import { router } from 'expo-router';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Button, Card, Icon, Row, Screen, Section } from '@/components/ui';
import { View } from 'react-native';

// A hub, not a feed: three destinations, with the patient guide leading.
export default function DiscoverScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <Card tone="violet" style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="book" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="headline">{t('guide.cardTitle')}</AppText>
            <AppText variant="subhead" tone="secondary">
              {t('guide.cardDesc')}
            </AppText>
          </View>
        </View>
        <Button title={t('guide.open')} onPress={() => router.push('/guide')} />
      </Card>

      <Section>
        <Row icon="map" iconColor={colors.success} title={t('pharmacy.title')} subtitle={t('pharmacy.subtitle')} chevron onPress={() => router.push('/(tabs)/(discover)/pharmacies')} />
        <Row icon="news" iconColor={colors.info} title={t('learn.title')} subtitle={t('learn.subtitle')} chevron onPress={() => router.push('/(tabs)/(discover)/learn')} />
      </Section>
    </Screen>
  );
}
