import React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useColorScheme } from 'react-native';
import { radius, useTheme } from '@/theme';

// Material strategy, best available first:
//   iOS 26+  -> Liquid Glass          (real, system-rendered)
//   older iOS -> system blur material  (expo-blur)
//   Android   -> opaque tonal surface  (no fake blur — Material uses elevation)
// Use for navigation-layer chrome and floating controls, never content cards.
const canGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export function GlassSurface({
  children,
  style,
  interactive,
  borderRadius = radius.pill,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  borderRadius?: number;
}) {
  const { colors } = useTheme();
  const scheme = useColorScheme();
  if (canGlass) {
    return (
      <GlassView isInteractive={interactive} style={[{ borderRadius, borderCurve: 'continuous' }, style]}>
        {children}
      </GlassView>
    );
  }
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint={scheme === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
        intensity={80}
        style={[{ borderRadius, borderCurve: 'continuous', overflow: 'hidden' }, style]}
      >
        {children}
      </BlurView>
    );
  }
  return (
    <View
      style={[
        {
          borderRadius,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 0.5,
          borderColor: colors.separator,
          boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
