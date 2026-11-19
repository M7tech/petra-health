import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, IconButton, haptics } from '@/components/ui';
import { AddedGuidance } from './ui';

const SKIN = 26;
const FAT = 96;
const MUSCLE = 84;
const NEEDLE = 48;

// A generic, schematic cross-section: skin, the fat layer under it (subcutaneous), then muscle.
// Layer thicknesses are illustrative only — the app does not claim exact depths or angles.
// The needle is drawn straight in, as in the manufacturer's step 12 illustration.
export default function CrossSection({ replayKey, siteLabel }: { replayKey: number; siteLabel: string }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const depth = useSharedValue(0);

  const play = React.useCallback(() => {
    cancelAnimation(depth);
    if (reduce) {
      depth.value = 1;
      return;
    }
    depth.value = 0;
    depth.value = withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.cubic) });
  }, [depth, reduce]);

  useEffect(() => {
    play();
  }, [replayKey, play]);

  // Tip starts above the skin and ends inside the fat layer.
  const needle = useAnimatedStyle(() => ({ top: interpolate(depth.value, [0, 1], [-NEEDLE - 20, SKIN + 24 - NEEDLE]) }));
  const drops = useAnimatedStyle(() => ({ opacity: interpolate(depth.value, [0.8, 1], [0, 1]), transform: [{ scale: interpolate(depth.value, [0.8, 1], [0.4, 1]) }] }));

  const layers = [
    { key: 'skin', h: SKIN, bg: '#F2CBA8', label: t('train.sites.skin') },
    { key: 'fat', h: FAT, bg: '#F8E3A8', label: t('train.sites.fat') },
    { key: 'muscle', h: MUSCLE, bg: '#C0575F', label: t('train.sites.muscle') },
  ];

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText variant="headline">{t('train.sites.crossTitle')}</AppText>
          <AppText variant="footnote" tone="secondary">
            {siteLabel}
          </AppText>
        </View>
        <IconButton
          icon="restart"
          label={t('train.common.replay')}
          onPress={() => {
            haptics.select();
            play();
          }}
        />
      </View>

      <View style={{ height: SKIN + FAT + MUSCLE, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.fill }}>
        {layers.map((l) => (
          <View key={l.key} style={{ height: l.h, backgroundColor: l.bg, justifyContent: 'center', paddingHorizontal: spacing.md }}>
            <AppText variant="footnote" weight="600" style={{ color: l.key === 'muscle' ? '#FFFFFF' : '#4A3A2A' }}>
              {l.label}
            </AppText>
          </View>
        ))}
        {/* Blood vessels run through the deeper tissue — drawn so the learner can see the needle stays away from them. */}
        {[28, 70].map((p) => (
          <View key={p} pointerEvents="none" style={{ position: 'absolute', top: SKIN + FAT + 26, start: `${p}%`, width: 20, height: 20, borderRadius: 10, backgroundColor: '#8E1B2B', borderWidth: 3, borderColor: '#D94A5C' }} />
        ))}
        {/* Medicine spreading in the fat layer once the needle is in. */}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: SKIN + 36, start: '50%', marginStart: -26, flexDirection: 'row', gap: 6 }, drops]}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.tint, opacity: 0.8 }} />
          ))}
        </Animated.View>
        {/* Needle: hub at the top, shaft below. */}
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', start: '50%', marginStart: -5, width: 10, alignItems: 'center' }, needle]}>
          <View style={{ width: 22, height: 12, borderRadius: 4, backgroundColor: colors.info }} />
          <View style={{ width: 3, height: NEEDLE - 12, backgroundColor: '#8A8F98' }} />
        </Animated.View>
      </View>

      <View style={{ gap: spacing.sm }}>
        {[
          { ok: true, text: t('train.sites.intoFat') },
          { ok: false, text: t('train.sites.notMuscle') },
          { ok: false, text: t('train.sites.notVessel') },
        ].map((m) => (
          <View key={m.text} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: m.ok ? colors.successSoft : colors.dangerSoft, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Icon name={m.ok ? 'checkCircle' : 'close'} size={18} color={m.ok ? colors.success : colors.danger} />
            <AppText variant="subhead" weight="600" style={{ flex: 1, color: m.ok ? colors.success : colors.danger }}>
              {m.text}
            </AppText>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#8E1B2B', borderWidth: 2, borderColor: '#D94A5C' }} />
          <AppText variant="caption" tone="secondary">
            {t('train.sites.vessel')}
          </AppText>
        </View>
      </View>

      <AppText variant="subhead" tone="secondary">
        {t('train.sites.crossBody')}
      </AppText>
      <AddedGuidance icon="info" body={t('train.sites.illustrative')} />
    </Card>
  );
}
