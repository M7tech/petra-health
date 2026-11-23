import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Screen } from '@/components/ui';
import { FoodGlyph, GlyphName, Plate3D } from '@/nutrition/Illustrations';
import { Chip, Disclaimer, Notice, PageHead, Photo, RefTag } from '@/nutrition/ui';

export default function PlatePage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const shares: { pct: string; title: string; body: string; glyphs: GlyphName[]; fg: string; bg: string }[] = [
    { pct: '50%', title: t('nutri.plate.vegT'), body: t('nutri.plate.vegD'), glyphs: ['broccoli', 'carrot', 'apple'], fg: colors.success, bg: colors.successSoft },
    { pct: '25%', title: t('nutri.plate.protT'), body: t('nutri.plate.protD'), glyphs: ['fish', 'egg', 'beans'], fg: colors.violet, bg: colors.violetSoft },
    { pct: '25%', title: t('nutri.plate.grainT'), body: t('nutri.plate.grainD'), glyphs: ['bread', 'rice'], fg: colors.warning, bg: colors.warningSoft },
  ];
  return (
    <Screen>
      <PageHead kicker={t('nutri.plate.kicker')} title={t('nutri.plate.title')} sub={t('nutri.plate.sub')} />
      <Photo id="plate" height={200} label={t('nutri.plate.title')} />
      <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <Plate3D width={300} />
      </Card>

      {shares.map((s) => (
        <View key={s.pct + s.title} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: s.bg }}>
          <AppText variant="title1" weight="800" style={{ color: s.fg, minWidth: 76 }} numeric>
            {s.pct}
          </AppText>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="headline" style={{ color: s.fg }}>
              {s.title}
            </AppText>
            <AppText variant="subhead">{s.body}</AppText>
          </View>
          <View style={{ gap: 2 }}>
            {s.glyphs.slice(0, 2).map((g) => (
              <FoodGlyph key={g} name={g} size={34} />
            ))}
          </View>
        </View>
      ))}

      <Notice icon="info">
        <AppText variant="subhead">{t('nutri.plate.note')}</AppText>
        <RefTag ids="3" />
      </Notice>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip icon="fork" text={t('nutri.plate.h1')} />
        <Chip icon="clock" text={t('nutri.plate.h2')} />
        <Chip icon="checkCircle" text={t('nutri.plate.h3')} />
        <Chip icon="target" text={t('nutri.plate.h4')} />
      </View>
      <Disclaimer />
    </Screen>
  );
}
