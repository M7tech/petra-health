import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { spacing, useTheme } from '@/theme';
import { AppText, Card, Icon, Row, Section, haptics } from '@/components/ui';

const IMG_SITES = require('../../../assets/guide/guide-sites.jpg');
const CYCLE_MS = 2800;

// Where each recommended site sits on the body illustration (% of the image) and how big its ring is.
const SITES = [
  { key: 'site1', x: 37.3, y: 46.9, size: 76 },
  { key: 'site2', x: 45.8, y: 35.1, size: 44 },
  { key: 'site3', x: 38.1, y: 64.8, size: 58 },
] as const;

function Marker({ x, y, size, active }: { x: number; y: number; size: number; active: boolean }) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const p = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(p);
    p.value = 0;
    if (active && !reduce) p.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }), -1, false);
  }, [active, reduce, p]);

  const pulse = useAnimatedStyle(() => ({ opacity: active ? 0.85 * (1 - p.value) : 0, transform: [{ scale: 1 + p.value * 0.8 }] }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: colors.tint }, pulse]} />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: active ? 3 : 2,
          borderColor: colors.tint,
          backgroundColor: active ? colors.tintSoft : 'transparent',
          opacity: active ? 1 : 0.3,
        }}
      />
    </View>
  );
}

/** The body diagram with the recommended sites pulsing in turn; tap a site to hold it. */
export default function SitesAnimation({ active: controlled, onSelect, autoCycle = true, showList = true }: { active?: number; onSelect?: (i: number) => void; autoCycle?: boolean; showList?: boolean } = {}) {
  const { t } = useI18n();
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(0);
  const active = controlled ?? inner;
  const setActive = (i: number | ((a: number) => number)) => {
    const v = typeof i === "function" ? i(active) : i;
    setInner(v);
    onSelect?.(v);
  };
  const g = (k: string) => t(`guide.${k}`);

  useEffect(() => {
    if (reduce || !autoCycle) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % SITES.length), CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, reduce, autoCycle]);

  return (
    <>
      <Card padded={false} style={{ overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        {/* Physical left/right: the picture never mirrors, so neither may the markers. */}
        <View style={{ width: '100%', aspectRatio: 775 / 949, direction: 'ltr' }}>
          <Image accessible accessibilityRole="image" accessibilityLabel={g('sitesTitle')} source={IMG_SITES} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          {SITES.map((s, i) => (
            <Marker key={s.key} x={s.x} y={s.y} size={s.size} active={i === active} />
          ))}
        </View>
      </Card>
      <AppText variant="footnote" tone="secondary" style={{ paddingHorizontal: spacing.xs }}>
        {t('ui.sitesTapHint')}
      </AppText>
      {showList ? (
      <Section>
        {SITES.map((s, i) => (
          <Row
            key={s.key}
            leading={
              <AppText variant="headline" numeric style={{ color: i === active ? colors.tint : colors.secondaryLabel }}>
                {i + 1}
              </AppText>
            }
            title={g(s.key)}
            right={i === active ? <Icon name="check" size={18} color={colors.tint} weight="bold" /> : undefined}
            onPress={() => {
              haptics.select();
              setActive(i);
            }}
          />
        ))}
      </Section>
      ) : null}
    </>
  );
}
