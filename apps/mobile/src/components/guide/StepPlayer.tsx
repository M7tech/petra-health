import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconButton, PressableScale, haptics } from '@/components/ui';
import { STEP_COUNT, STEP_IMAGES, groupOfStep } from './data';

const STEP_MS = 6000;

/** The 18 injection steps as a self-playing walkthrough with the real step photos. */
export default function StepPlayer() {
  const { t, isRTL } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(1);
  const [playing, setPlaying] = useState(!reduce);
  const progress = useSharedValue(0);
  const zoom = useSharedValue(1);
  const fade = useSharedValue(1);
  const g = (k: string) => t(`guide.${k}`);

  const go = (n: number) => setStep(((n - 1 + STEP_COUNT) % STEP_COUNT) + 1);

  // Each step: progress bar fills, the photo drifts in slowly, then the next step plays.
  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(zoom);
    progress.value = 0;
    zoom.value = 1;
    if (!playing || reduce) return;
    progress.value = withTiming(1, { duration: STEP_MS, easing: Easing.linear });
    zoom.value = withTiming(1.07, { duration: STEP_MS, easing: Easing.out(Easing.quad) });
    const id = setTimeout(() => setStep((s) => (s % STEP_COUNT) + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step, playing, reduce, progress, zoom]);

  // Cross-fade each new photo in (a plain animated opacity — resets on every step, so it can never stick invisible).
  useEffect(() => {
    cancelAnimation(fade);
    if (reduce) {
      fade.value = 1;
      return;
    }
    fade.value = 0;
    fade.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
  }, [step, reduce, fade]);

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const drift = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: zoom.value }] }));

  const prevIcon = isRTL ? 'chevronRight' : 'chevronLeft';
  const nextIcon = isRTL ? 'chevronLeft' : 'chevronRight';

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <View style={{ height: 240, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        <Animated.View style={[{ ...absoluteFill, padding: spacing.lg }, drift]}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton
            icon={prevIcon}
            label={t('ui.prevStep')}
            size={44}
            onPress={() => {
              haptics.select();
              go(step - 1);
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
          <IconButton
            icon={nextIcon}
            label={t('ui.nextStep')}
            size={44}
            onPress={() => {
              haptics.select();
              go(step + 1);
            }}
          />
        </View>
      </View>
    </Card>
  );
}

const absoluteFill = { position: 'absolute' as const, top: 0, bottom: 0, left: 0, right: 0 };
