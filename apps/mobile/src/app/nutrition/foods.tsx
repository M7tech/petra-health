import React from 'react';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, Screen } from '@/components/ui';
import { GlyphName, GlyphTile } from '@/nutrition/Illustrations';
import { Chip, Disclaimer, Notice, PageHead, Photo, RefTag } from '@/nutrition/ui';

function Group({ title, body, glyphs, bg }: { title: string; body: string; glyphs: GlyphName[]; bg: string }) {
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {glyphs.map((g) => (
          <GlyphTile key={g} name={g} size={44} bg={bg} />
        ))}
      </View>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="subhead">{body}</AppText>
      </View>
    </Card>
  );
}

export default function FoodsPage() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Screen>
      <PageHead title={t('nutri.foods.title')} sub={t('nutri.foods.sub')} />
      <Photo id="foods" height={200} label={t('nutri.foods.title')} />
      <Group title={t('nutri.foods.protT')} body={t('nutri.foods.protD')} glyphs={['egg', 'fish', 'beans']} bg={colors.violetSoft} />
      <Group title={t('nutri.foods.fibT')} body={t('nutri.foods.fibD')} glyphs={['broccoli', 'apple', 'bread']} bg={colors.successSoft} />
      <Group title={t('nutri.foods.fatT')} body={t('nutri.foods.fatD')} glyphs={['avocado', 'nuts']} bg={colors.warningSoft} />

      <Card style={{ gap: spacing.sm, borderWidth: 1.5, borderColor: colors.warning }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="alert" size={22} color={colors.warning} />
          <AppText variant="headline" style={{ color: colors.warning }}>
            {t('nutri.foods.limT')}
          </AppText>
        </View>
        {['lim1', 'lim2', 'lim3', 'lim4'].map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Icon name="close" size={16} color={colors.warning} />
            <AppText variant="subhead" style={{ flex: 1 }}>
              {t(`nutri.foods.${k}`)}
            </AppText>
          </View>
        ))}
        <Notice icon="warning" tone="warning">
          <AppText variant="subhead">{t('nutri.foods.alcohol')}</AppText>
          <RefTag ids="1, 2" />
        </Notice>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <Chip icon="target" text={t('nutri.foods.tip1')} />
        <Chip icon="drop" text={t('nutri.foods.tip2')} />
        <Chip icon="flame" text={t('nutri.foods.tip3')} />
        <Chip icon="checkCircle" text={t('nutri.foods.tip4')} />
      </View>
      <Disclaimer />
    </Screen>
  );
}
