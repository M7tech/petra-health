import React, { useEffect, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import Animated, { Easing, SharedValue, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, PressableScale, Row, Section, haptics } from '@/components/ui';
import { AddedGuidance, Callout, Heading, ModuleScreen } from '@/training/ui';

const BOX_15 = require('../../../assets/training/box-1-5.jpg');
const BOX_3 = require('../../../assets/training/box-3.jpg');
const RATIO = 722 / 330;
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];

// The guide's first-8-weeks schedule (guide p.4): weeks 1–4 0.25 mg, weeks 5–8 0.5 mg; first box, same box, second box.
function weekInfo(w: number) {
  if (w <= 4) return { mg: '0.25', text: 'w14', boxKey: 'box1', accent: 'success' as const };
  if (w <= 6) return { mg: '0.5', text: 'w56', boxKey: 'sameBox1', accent: 'success' as const };
  return { mg: '0.5', text: 'w78', boxKey: 'box2', accent: 'violet' as const };
}

function WeekDot({ index, phase }: { index: number; phase: SharedValue<number> }) {
  const { colors } = useTheme();
  const style = useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(phase.value - index));
    return { opacity: 0.35 + 0.65 * near, transform: [{ scale: 1 + 0.5 * near }] };
  });
  const last = index === 6;
  return <Animated.View style={[{ width: 14, height: 14, borderRadius: 7, backgroundColor: last ? colors.violet : colors.tint }, style]} />;
}

/** A dot sweeps across seven days and lands on day seven: one injection, once a week. */
function OnceAWeek() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const phase = useSharedValue(6);

  useEffect(() => {
    cancelAnimation(phase);
    if (reduce) {
      phase.value = 6;
      return;
    }
    phase.value = 0;
    phase.value = withRepeat(withTiming(6, { duration: 4200, easing: Easing.inOut(Easing.quad) }), -1, false);
    return () => cancelAnimation(phase);
  }, [reduce, phase]);

  return (
    <Card tone="violet" style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View style={{ width: 64, height: 68, borderRadius: radius.md, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center' }}>
          <View style={{ height: 18, alignSelf: 'stretch', backgroundColor: colors.violet }} />
          <AppText variant="title1" tone="violet" style={{ marginTop: 4 }}>
            7
          </AppText>
        </View>
        <View style={{ flex: 1, gap: spacing.sm }}>
          <AppText variant="headline" tone="violet">
            {t('train.dose.onceTitle')}
          </AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <WeekDot key={d} index={d} phase={phase} />
            ))}
          </View>
        </View>
      </View>
      <AppText variant="subhead" tone="secondary">
        {t('train.dose.onceBody')}
      </AppText>
    </Card>
  );
}

export default function DoseModule() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [week, setWeek] = useState(1);
  const info = weekInfo(week);
  const accent = info.accent === 'success' ? colors.success : colors.violet;

  const fill = useSharedValue(1 / 8);
  const fade = useSharedValue(1);
  useEffect(() => {
    fill.value = reduce ? week / 8 : withTiming(week / 8, { duration: 450, easing: Easing.out(Easing.cubic) });
    cancelAnimation(fade);
    if (reduce) {
      fade.value = 1;
      return;
    }
    fade.value = 0;
    fade.value = withTiming(1, { duration: 300 });
  }, [week, reduce, fill, fade]);
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const swap = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <ModuleScreen module="dose">
      <Heading sub={t('train.dose.intro')}>{t('guide.pensTitle')}</Heading>
      <AddedGuidance icon="shield" body={t('train.common.semetraOnly')} />

      <Card padded={false} style={{ overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        <Animated.View style={swap}>
          <Image accessible accessibilityRole="image" accessibilityLabel={t('train.dose.pen15')} source={BOX_15} style={{ width: '100%', aspectRatio: RATIO }} resizeMode="contain" />
        </Animated.View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="footnote" tone="secondary">
          {t('train.dose.pickWeek')}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {WEEKS.map((w) => {
            const wi = weekInfo(w);
            const active = w === week;
            const c = wi.accent === 'success' ? colors.success : colors.violet;
            return (
              <PressableScale
                key={w}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${t('train.dose.week')} ${w}: ${wi.mg} mg`}
                haptic={false}
                onPress={() => {
                  haptics.select();
                  setWeek(w);
                }}
                innerStyle={{ width: 62, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md, backgroundColor: active ? c : colors.fill }}
              >
                <AppText variant="caption" tone={active ? 'onTint' : 'secondary'}>
                  {t('train.dose.week')}
                </AppText>
                <AppText variant="title3" weight="700" numeric tone={active ? 'onTint' : 'label'}>
                  {w}
                </AppText>
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={{ alignItems: 'center', gap: 2, paddingVertical: spacing.sm }}>
          <AppText variant="largeTitle" weight="700" numeric style={{ color: accent }}>
            {info.mg} mg
          </AppText>
          <AppText variant="subhead" tone="secondary">
            {t('train.dose.perWeek')} · {t(`guide.${info.boxKey}`)}
          </AppText>
        </View>

        <View style={{ gap: spacing.xs }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.fill, overflow: 'hidden' }}>
            <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: accent }, bar]} />
          </View>
          <AppText variant="caption" tone="secondary" numeric>
            {week} {t('train.dose.progress')}
          </AppText>
        </View>
        <AppText variant="body">{t(`train.dose.${info.text}`)}</AppText>
      </Card>

      <OnceAWeek />

      <Heading>{t('train.dose.mgTitle')}</Heading>
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs, backgroundColor: colors.tintSoft, borderRadius: radius.md, padding: spacing.md }}>
            <Icon name="syringe" size={26} color={colors.tint} />
            <AppText variant="title3" tone="tint" numeric>
              mg
            </AppText>
          </View>
          <View style={{ flex: 1, alignItems: 'center', gap: spacing.xs, backgroundColor: colors.infoSoft, borderRadius: radius.md, padding: spacing.md }}>
            <Icon name="drop" size={26} color={colors.info} />
            <AppText variant="title3" numeric style={{ color: colors.info }}>
              ml
            </AppText>
          </View>
        </View>
        <AppText variant="subhead" tone="secondary">
          {t('train.dose.mgBody')}
        </AppText>
      </Card>

      <Heading sub={t('guide.after8Sub')}>{t('guide.after8Title')}</Heading>
      <Section>
        <Row icon="syringe" title={t('guide.continue')} subtitle={t('guide.box15')} value="0.5 mg" />
        <Row icon="target" iconColor={colors.violet} title={t('guide.stepUp')} subtitle={t('guide.box3')} value="1 mg" />
      </Section>
      <Card padded={false} style={{ overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        <Image accessible accessibilityRole="image" accessibilityLabel={t('train.dose.pen3')} source={BOX_3} style={{ width: '100%', aspectRatio: RATIO }} resizeMode="contain" />
      </Card>
      <Callout icon="info" body={t('train.dose.physician')} tint={colors.warning} />
    </ModuleScreen>
  );
}
