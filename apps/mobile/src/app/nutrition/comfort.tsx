import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconName, Screen } from '@/components/ui';
import { FoodGlyph, GlyphName } from '@/nutrition/Illustrations';
import { Disclaimer, Notice, PageHead, Photo, RefTag } from '@/nutrition/ui';

function Symptom({ icon, title, body, tint }: { icon: IconName; title: string; body: string; tint: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={22} color={colors.label} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead">{body}</AppText>
      </View>
    </Card>
  );
}

export default function ComfortPage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const meals: { glyph: GlyphName; k: 'b' | 'l' | 's' | 'd' }[] = [
    { glyph: 'yogurt', k: 'b' },
    { glyph: 'rice', k: 'l' },
    { glyph: 'apple', k: 's' },
    { glyph: 'soup', k: 'd' },
  ];
  return (
    <Screen>
      <PageHead kicker={t('nutri.comfort.kicker')} title={t('nutri.comfort.title')} sub={t('nutri.comfort.sub')} />
      <Photo id="comfort" height={200} label={t('nutri.comfort.title')} />
      <Symptom icon="thermo" title={t('nutri.comfort.nauT')} body={t('nutri.comfort.nauD')} tint={colors.warningSoft} />
      <Symptom icon="drop" title={t('nutri.comfort.conT')} body={t('nutri.comfort.conD')} tint={colors.infoSoft} />
      <Symptom icon="flame" title={t('nutri.comfort.refT')} body={t('nutri.comfort.refD')} tint={colors.dangerSoft} />

      <Card style={{ gap: spacing.md }}>
        <AppText variant="headline">{t('nutri.comfort.dayT')}</AppText>
        {meals.map((m) => (
          <View key={m.k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}>
              <FoodGlyph name={m.glyph} size={44} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="footnote" weight="700" tone="tint">
                {t(`nutri.comfort.${m.k}T`)}
              </AppText>
              <AppText variant="subhead">{t(`nutri.comfort.${m.k}D`)}</AppText>
            </View>
          </View>
        ))}
        <RefTag ids="1, 2" />
      </Card>

      <Notice icon="info">{t('nutri.comfort.skip')}</Notice>
      <Notice icon="alert" tone="danger">
        {t('nutri.comfort.urgent')}
      </Notice>
      <Disclaimer />
    </Screen>
  );
}
