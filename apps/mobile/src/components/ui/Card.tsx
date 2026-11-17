import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { radius, spacing, useTheme } from '@/theme';

// Cards are for hero and metric moments only — lists use Section/Row.
export function Card({
  children,
  tone = 'plain',
  padded = true,
  style,
}: {
  children: React.ReactNode;
  tone?: 'plain' | 'tinted' | 'filled' | 'violet';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = { plain: colors.surface, tinted: colors.tintSoft, filled: colors.tint, violet: colors.violetSoft }[tone];
  return (
    <View
      style={[
        { backgroundColor: bg, borderRadius: radius.xl, borderCurve: 'continuous', padding: padded ? spacing.lg : 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
