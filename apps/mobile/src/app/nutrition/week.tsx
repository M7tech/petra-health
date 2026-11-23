import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, PressableScale, Screen, haptics } from '@/components/ui';
import { FoodGlyph, GlyphName } from '@/nutrition/Illustrations';
import { NUTRITION_DAY_KEYS } from '@/i18n/nutritionStrings';
import { Disclaimer, Notice, PageHead, Photo, RefTag } from '@/nutrition/ui';

const MEALS: { k: 'b' | 'l' | 's' | 'd'; label: 'mealB' | 'mealL' | 'mealS' | 'mealD'; glyph: GlyphName }[] = [
  { k: 'b', label: 'mealB', glyph: 'egg' },
  { k: 'l', label: 'mealL', glyph: 'soup' },
  { k: 's', label: 'mealS', glyph: 'apple' },
  { k: 'd', label: 'mealD', glyph: 'rice' },
];

export default function WeekPage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [i, setI] = useState(0);
  const day = NUTRITION_DAY_KEYS[i];
  return (
    <Screen>
      <PageHead kicker={t('nutri.week.kicker')} title={t('nutri.week.title')} sub={t('nutri.week.intro')} />
      <Notice icon="drop">{t('nutri.week.tip')}</Notice>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
        {NUTRITION_DAY_KEYS.map((k, n) => {
          const on = n === i;
          return (
            <PressableScale
              key={k}
              haptic={false}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                haptics.select();
                setI(n);
              }}
              innerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: on ? colors.tint : colors.fill }}
            >
              <AppText variant="subhead" weight="600" style={{ color: on ? colors.onTint : colors.label }}>
                {t(`nutri.week.${k}.name`)}
              </AppText>
            </PressableScale>
          );
        })}
      </ScrollView>

      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="title3" weight="700">
            {t(`nutri.week.${day}.name`)}
          </AppText>
          <AppText variant="footnote" weight="600" tone="secondary" numeric>
            {t('nutri.week.dayWord')} {i + 1} / 7
          </AppText>
        </View>
        {MEALS.map((m) => (
          <View key={m.k} style={{ gap: spacing.sm }}>
            <Photo id={`${day}-${m.k}`} height={140} label={t(`nutri.week.${m.label}`)} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 60, height: 60, borderRadius: radius.lg, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}>
                <FoodGlyph name={m.glyph} size={44} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="footnote" weight="700" tone="tint">
                  {t(`nutri.week.${m.label}`)}
                </AppText>
                <AppText variant="subhead">{t(`nutri.week.${day}.${m.k}`)}</AppText>
              </View>
            </View>
          </View>
        ))}
        <Notice icon="info">{t(`nutri.week.${day}.n`)}</Notice>
        <RefTag ids="1, 2" />
      </Card>

      <Card tone="filled" style={{ gap: spacing.xs }}>
        <AppText variant="headline">{t('nutri.week.read')}</AppText>
        <AppText variant="subhead">{t('nutri.week.readD')}</AppText>
      </Card>
      <Disclaimer />
    </Screen>
  );
}
