import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Screen } from '@/components/ui';
import { FoodGlyph, GlyphName } from '@/nutrition/Illustrations';
import { Disclaimer, Notice, PageHead, Photo, RefTag } from '@/nutrition/ui';

function Priority({ glyph, big, unit, title, body, refs, fg, bg }: { glyph: GlyphName; big: string; unit: string; title: string; body: string; refs: string; fg: string; bg: string }) {
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View style={{ width: 84, height: 84, borderRadius: radius.xl, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <FoodGlyph name={glyph} size={60} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="largeTitle" weight="800" style={{ color: fg }} numeric>
            {big}
          </AppText>
          <AppText variant="footnote" weight="600" tone="secondary">
            {unit}
          </AppText>
        </View>
      </View>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead">{body}</AppText>
        <RefTag ids={refs} />
      </View>
    </Card>
  );
}

export default function DailyPage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <PageHead kicker={t('nutri.daily.kicker')} title={t('nutri.daily.title')} sub={t('nutri.daily.sub')} />
      <Photo id="daily" height={200} label={t('nutri.daily.title')} />
      <Priority glyph="egg" big={t('nutri.daily.protBig')} unit={t('nutri.daily.protUnit')} title={t('nutri.daily.protT')} body={t('nutri.daily.protD')} refs="1" fg={colors.violet} bg={colors.violetSoft} />
      <Priority glyph="water" big={t('nutri.daily.fluBig')} unit={t('nutri.daily.fluUnit')} title={t('nutri.daily.fluT')} body={t('nutri.daily.fluD')} refs="1" fg={colors.info} bg={colors.infoSoft} />
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <View style={{ width: 84, height: 84, borderRadius: radius.xl, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' }}>
            <FoodGlyph name="apple" size={60} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="largeTitle" weight="800" style={{ color: colors.success }} numeric>
              {t('nutri.daily.movBig')}
            </AppText>
            <AppText variant="footnote" weight="600" tone="secondary">
              {t('nutri.daily.movUnit')}
            </AppText>
          </View>
        </View>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="headline">{t('nutri.daily.movT')}</AppText>
          <AppText variant="subhead">{t('nutri.daily.movD')}</AppText>
          <RefTag ids="1, 4" />
        </View>
      </Card>
      <Notice icon="alert" tone="warning">
        {t('nutri.daily.caution')}
      </Notice>
      <Disclaimer />
    </Screen>
  );
}
