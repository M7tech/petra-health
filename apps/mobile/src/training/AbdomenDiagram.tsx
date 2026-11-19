import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, spacing, useTheme } from '@/theme';
import { AppText, Card } from '@/components/ui';
import { AddedGuidance, SourceTag } from './ui';

const RING = 86; // schematic: the ring stands for the 5 cm distance; the drawing is NOT to scale

/**
 * Abdomen sketch: navel, a 5 cm "keep-away" ring, and the injection areas outside it.
 * The leaflet only says "around the navel"; the 5 cm distance is ADDED guidance pending clinical
 * confirmation for Semetra, so it is shown as such (dashed card + note), never as leaflet wording.
 */
export default function AbdomenDiagram() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
    if (!reduce) pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [reduce, pulse]);
  const zoneStyle = useAnimatedStyle(() => ({ opacity: 0.55 + 0.35 * pulse.value }));

  const zone = (side: 'start' | 'end') => (
    <Animated.View
      style={[
        { position: 'absolute', top: 38, [side]: '7%', width: '24%', height: 96, borderRadius: 40, backgroundColor: colors.tintSoft, borderWidth: 2, borderColor: colors.tint, alignItems: 'center', justifyContent: 'center' },
        zoneStyle,
      ]}
    >
      <AppText variant="caption" weight="600" tone="tint" style={{ textAlign: 'center', paddingHorizontal: 2 }}>
        {t('train.sites.zone')}
      </AppText>
    </Animated.View>
  );

  return (
    <View style={{ gap: spacing.md }}>
      <Card style={{ gap: spacing.sm }}>
        <AppText variant="headline">{t('train.sites.abdTitle')}</AppText>
        <SourceTag kind="leaflet" />
        <AppText variant="subhead" tone="secondary">
          {t('train.sites.abdLeaflet')}
        </AppText>

        <View style={{ height: 172, borderRadius: radius.xl, backgroundColor: '#F2CBA8', overflow: 'hidden', direction: 'ltr' }}>
          {zone('start')}
          {zone('end')}
          {/* The 5 cm ring and the navel. */}
          <View style={{ position: 'absolute', start: '50%', top: '50%', marginStart: -RING / 2, marginTop: -RING / 2, width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2.5, borderStyle: 'dashed', borderColor: colors.danger, backgroundColor: 'rgba(215,0,21,0.08)' }} />
          <View style={{ position: 'absolute', start: '50%', top: '50%', marginStart: -5, marginTop: -5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#8C5A3C' }} />
          {/* Distance marker: navel → ring edge. */}
          <View style={{ position: 'absolute', start: '50%', top: '50%', marginStart: 5, marginTop: -1, width: RING / 2 - 5, height: 2, backgroundColor: colors.danger }} />
          <View style={{ position: 'absolute', start: '50%', top: '50%', marginStart: RING / 2 + 6, marginTop: -10 }}>
            <AppText variant="caption" weight="700" style={{ color: colors.danger }}>
              ≥ 5 cm
            </AppText>
          </View>
          <View style={{ position: 'absolute', start: '50%', top: '50%', marginStart: -26, marginTop: RING / 2 + 6, width: 52, alignItems: 'center' }}>
            <AppText variant="caption" style={{ color: '#6B4630' }}>
              {t('train.sites.navel')}
            </AppText>
          </View>
        </View>
      </Card>
      <AddedGuidance icon="pin" body={t('train.sites.abdAdded')} />
    </View>
  );
}
