import { Platform } from 'react-native';
import { Easing } from 'react-native-reanimated';

// 4-point grid. Named by size, never by use.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// Screen edge padding (iOS standard 16).
export const gutter = spacing.lg;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

// Shadows are boxShadow strings. iOS grouped lists use none (hairlines and
// colour carry the hierarchy); only floating elements get one.
export const shadows = {
  none: undefined,
  floating: '0 6px 20px rgba(0, 0, 0, 0.16)',
  raised: '0 2px 8px rgba(0, 0, 0, 0.08)',
} as const;

// Minimum tap target (HIG 44pt, Material 48dp).
export const hitTarget = Platform.select({ ios: 44, default: 48 });

export const motion = {
  fast: 140,
  base: 240,
  slow: 380,
  /** Press feedback scale. */
  pressScale: 0.97,
} as const;

// Easing for timed (non-gesture) motion. Strong ease-out: entrances and state changes start fast and settle.
export const easings = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
} as const;

// Reanimated spring presets (mirror SwiftUI .smooth / .snappy / .bouncy).
export const springs = {
  smooth: { damping: 24, stiffness: 220, mass: 1 },
  snappy: { damping: 20, stiffness: 360, mass: 1 },
  bouncy: { damping: 13, stiffness: 240, mass: 1 },
} as const;
