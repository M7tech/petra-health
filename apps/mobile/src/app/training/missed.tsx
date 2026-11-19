import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, PressableScale, haptics } from '@/components/ui';
import { Callout, Heading, ModuleScreen } from '@/training/ui';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/**
 * Guide p.14: 0 = injection day. 1–5 days later: take the missed dose as soon as you remember.
 * More than 5 days: skip it. Day 7 is the next scheduled dose. Pure day offsets: no calendar maths,
 * so no month / year / time-zone edge cases. This is an illustration, not personal advice.
 */
type Rule = 'due' | 'take' | 'skip' | 'next';
const ruleOf = (d: number): Rule => (d === 0 ? 'due' : d <= 5 ? 'take' : d === 6 ? 'skip' : 'next');

export default function MissedModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [dow, setDow] = useState<number>(6); // Saturday, as in the guide's example
  const [day, setDay] = useState(3);
  const rule = ruleOf(day);

  const color = { due: colors.violet, take: colors.success, skip: colors.warning, next: colors.violet }[rule];
  const message = { due: t('train.missed.todayIs'), take: t('train.missed.takeNow'), skip: t('train.missed.skipIt'), next: t('train.missed.nextIs') }[rule];
  const weekday = t(`train.missed.${DOW[(dow + day) % 7]}`);

  const jump = (d: number) => {
    haptics.select();
    setDay(d);
  };

  return (
    <ModuleScreen module="missed">
      <Heading sub={t('guide.missedIf')}>{t('guide.missedTitle')}</Heading>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="footnote" weight="600" tone="secondary">
          {t('train.missed.pickDay')}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {DOW.map((k, i) => {
            const active = i === dow;
            return (
              <PressableScale
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                haptic={false}
                onPress={() => {
                  haptics.select();
                  setDow(i);
                }}
                innerStyle={{ paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: active ? colors.violet : colors.fill }}
              >
                <AppText variant="subhead" weight="600" tone={active ? 'onTint' : 'label'}>
                  {t(`train.missed.${k}`)}
                </AppText>
              </PressableScale>
            );
          })}
        </ScrollView>

        <AppText variant="footnote" weight="600" tone="secondary">
          {t('train.missed.daysSince')}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => {
            const r = ruleOf(d);
            const bg = { due: colors.violet, take: colors.success, skip: colors.fill, next: colors.violet }[r];
            const selected = d === day;
            return (
              <PressableScale
                key={d}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t('train.missed.day')} ${d}`}
                haptic={false}
                onPress={() => jump(d)}
                scaleTo={0.92}
                innerStyle={{ height: selected ? 52 : 40, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 3 : 0, borderColor: colors.label, opacity: selected || r === 'due' || r === 'next' ? 1 : 0.8 }}
              >
                <AppText variant="subhead" weight="700" numeric style={{ color: r === 'skip' ? colors.label : '#FFFFFF' }}>
                  {d}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {[
            [colors.violet, t('train.missed.legendDue')],
            [colors.success, t('train.missed.legendTake')],
            [colors.fill, t('train.missed.legendSkip')],
          ].map(([c, label]) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c }} />
              <AppText variant="caption" tone="secondary">
                {label}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ gap: spacing.sm, borderWidth: 2, borderColor: color }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name={rule === 'take' ? 'checkCircle' : rule === 'skip' ? 'chevronRight' : 'calendar'} size={24} color={color} />
          <AppText variant="headline" style={{ color, flex: 1 }}>
            {t('train.missed.day')} {day} · {weekday}
          </AppText>
        </View>
        <AppText variant="body">{message}</AppText>
        {rule === 'take' || rule === 'skip' ? (
          <AppText variant="subhead" tone="secondary">
            {t('train.missed.then')}
          </AppText>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <PressableScale style={{ flex: 1 }} haptic={false} onPress={() => jump(3)} innerStyle={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.successSoft }}>
          <AppText variant="footnote" weight="600" style={{ color: colors.success }}>
            {t('train.missed.scenario1')}
          </AppText>
        </PressableScale>
        <PressableScale style={{ flex: 1 }} haptic={false} onPress={() => jump(6)} innerStyle={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft }}>
          <AppText variant="footnote" weight="600" style={{ color: colors.warning }}>
            {t('train.missed.scenario2')}
          </AppText>
        </PressableScale>
      </View>

      <Card tone="filled" style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Icon name="alert" size={26} color={colors.onTint} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline" tone="onTint">
            {t('train.missed.scenario3')}
          </AppText>
          <AppText variant="subhead" tone="onTint">
            {t('train.missed.double')}
          </AppText>
        </View>
      </Card>

      <Callout icon="info" body={t('train.missed.multiple')} tint={colors.warning} />
      <AppText variant="footnote" tone="secondary" style={{ textAlign: 'center' }}>
        {t('train.common.disclaimer')}
      </AppText>
    </ModuleScreen>
  );
}
