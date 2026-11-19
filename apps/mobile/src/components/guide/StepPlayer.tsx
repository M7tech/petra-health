import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconButton, PressableScale, haptics } from '@/components/ui';
import { STEP_IMAGES, STEP_COUNT, groupOfStep } from './data';

const STEP_MS = 6000;
const ALL_STEPS = Array.from({ length: STEP_COUNT }, (_, i) => i + 1);

// Steps that carry a safety instruction from the official guide (translations live in train.inject.*).
const SAFETY: Record<number, 'count6' | 'sharps' | 'newPenOnly'> = { 7: 'newPenOnly', 14: 'count6', 17: 'sharps' };

/** Injection steps as a self-playing walkthrough with the real step photos. Pass `steps` to play one chapter. */
export default function StepPlayer({ steps = ALL_STEPS }: { steps?: number[] }) {
  const { t, isRTL } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const progress = useSharedValue(0);
  const zoom = useSharedValue(1);
  const fade = useSharedValue(1);
  const g = (k: string) => t(`guide.${k}`);
  const total = steps.length;
  const chapterKey = steps.join(',');
  const step = steps[Math.min(idx, total - 1)];

  const go = (i: number) => setIdx(((i % total) + total) % total);

  // A new chapter always starts at its first step.
  useEffect(() => {
    setIdx(0);
  }, [chapterKey]);

  // Each step: progress bar fills, the photo drifts in slowly, then the next step plays.
  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(zoom);
    progress.value = 0;
    zoom.value = 1;
    if (!playing || reduce) return;
    progress.value = withTiming(1, { duration: STEP_MS, easing: Easing.linear });
    zoom.value = withTiming(1.07, { duration: STEP_MS, easing: Easing.out(Easing.quad) });
    const id = setTimeout(() => setIdx((i) => (i + 1) % total), STEP_MS);
    return () => clearTimeout(id);
  }, [idx, chapterKey, playing, reduce, progress, zoom, total]);

  // Cross-fade each new photo in (plain animated opacity: resets every step, so it can never stick invisible).
  useEffect(() => {
    cancelAnimation(fade);
    if (reduce) {
      fade.value = 1;
      return;
    }
    fade.value = 0;
    fade.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
  }, [idx, chapterKey, reduce, fade]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const drift = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: zoom.value }] }));

  const prevIcon = isRTL ? 'chevronRight' : 'chevronLeft';
  const nextIcon = isRTL ? 'chevronLeft' : 'chevronRight';
  const safety = SAFETY[step];

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <View style={{ height: 240, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, padding: spacing.lg }, drift]}>
          <Animated.Image
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${g('official')} ${step}`}
            source={STEP_IMAGES[step]}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>
        <View style={{ position: 'absolute', top: spacing.md, start: spacing.md, backgroundColor: colors.tint, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 }}>
          <AppText variant="footnote" weight="700" tone="onTint" numeric>
            {t('ui.stepLabel')} {step} / {STEP_COUNT}
          </AppText>
        </View>
      </View>

      <View style={{ height: 4, backgroundColor: colors.fill }}>
        <Animated.View style={[{ height: 4, backgroundColor: colors.tint }, bar]} />
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ gap: spacing.xs, minHeight: 84 }} accessibilityLiveRegion="polite">
          <AppText variant="footnote" weight="600" tone="tint">
            {g(groupOfStep(step))}
          </AppText>
          <AppText variant="body">{g(`step${step}`)}</AppText>
        </View>

        {safety ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningSoft, borderRadius: radius.md, padding: spacing.md }}>
            <Icon name="alert" size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <AppText variant="footnote" weight="700" style={{ color: colors.warning }}>
                {t('train.inject.safety')}
              </AppText>
              <AppText variant="footnote">{t(`train.inject.${safety}`)}</AppText>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            icon={prevIcon}
            label={t('ui.prevStep')}
            size={44}
            onPress={() => {
              haptics.select();
              go(idx - 1);
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <IconButton
              icon="restart"
              label={t('train.common.replay')}
              size={44}
              onPress={() => {
                haptics.select();
                setIdx(0);
                setPlaying(true);
              }}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={playing ? t('ui.pause') : t('ui.play')}
              haptic={false}
              onPress={() => {
                haptics.select();
                setPlaying((p) => !p);
              }}
              innerStyle={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={playing ? 'pause' : 'play'} size={24} color={colors.onTint} />
            </PressableScale>
          </View>
          <IconButton
            icon={nextIcon}
            label={t('ui.nextStep')}
            size={44}
            onPress={() => {
              haptics.select();
              go(idx + 1);
            }}
          />
        </View>
      </View>
    </Card>
  );
}
