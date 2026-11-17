import React, { useState } from 'react';
import { I18nManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { AppText } from './AppText';
import { haptics } from './haptics';
import { radius, spacing, springs, useTheme } from '@/theme';

// iOS-style segmented control with a sliding thumb. Mirrors correctly in RTL.
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segment = width > 0 ? (width - 4) / options.length : 0;
  const x = useSharedValue(0);
  const dir = I18nManager.isRTL ? -1 : 1;

  React.useEffect(() => {
    const target = dir * index * segment;
    x.value = reduce ? target : withSpring(target, springs.snappy);
  }, [index, segment, dir, reduce, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ backgroundColor: colors.fill, borderRadius: radius.md, borderCurve: 'continuous', padding: 2, flexDirection: 'row' }}
    >
      {segment > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 2,
              start: 2,
              width: segment,
              bottom: 2,
              borderRadius: radius.md - 2,
              borderCurve: 'continuous',
              backgroundColor: colors.surfaceRaised,
              boxShadow: '0 1px 3px rgba(0,0,0,0.14)',
            },
            thumb,
          ]}
        />
      ) : null}
      {options.map((o) => (
        <PressableScale
          key={o.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.key === value }}
          haptic={false}
          scaleTo={0.98}
          style={{ flex: 1 }}
          innerStyle={{ paddingVertical: spacing.sm, alignItems: 'center' }}
          onPress={() => {
            if (o.key !== value) {
              haptics.select();
              onChange(o.key);
            }
          }}
        >
          <AppText variant="footnote" weight={o.key === value ? '600' : '500'} numberOfLines={1}>
            {o.label}
          </AppText>
        </PressableScale>
      ))}
    </View>
  );
}
