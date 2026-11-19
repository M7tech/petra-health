import React from 'react';
import { I18nManager, Platform, RefreshControl, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gutter, spacing, useTheme } from '@/theme';

// Every screen's scroll container. It must be the first child of the route so
// native large-title headers and tab bars can inset and collapse correctly.
//
// Safe areas. On iOS `contentInsetAdjustmentBehavior="automatic"` insets the content for the status bar,
// notch, home indicator and any native header. Android has no such prop, and since Android 15 every app
// is drawn edge-to-edge: the status bar, camera cutout and navigation bar are NOT padded by the system.
// So on Android this component reads the real insets (status bar + display cutout + system bars, as
// reported by the device) and applies them itself:
//   • bottom / left / right — always, so content clears the gesture bar or 3-button navigation and any
//     landscape cutout (Android 16 ignores the portrait lock on large screens);
//   • top — only when `headerless` is set, i.e. no native header sits above the screen. A native header
//     (Expo Router / React Navigation) already clears the status bar and cutout, so adding the inset
//     there would pad twice.
// Nothing here is device-specific: it is whatever the OS reports, so Samsung, Xiaomi, Pixel, etc. all
// resolve the same way. Spacing never goes below the original design values.
export function Screen({
  children,
  keyboard,
  onRefresh,
  refreshing = false,
  gap = spacing.xl,
  contentContainerStyle,
  headerless = false,
}: {
  children: React.ReactNode;
  /** Forms: scrolls the focused input above the keyboard. */
  keyboard?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  gap?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** No native header above this screen (login, sign-up, onboarding): clear the status bar / cutout on Android. */
  headerless?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  const flat = StyleSheet.flatten(contentContainerStyle) ?? {};

  const baseTop = typeof flat.paddingTop === 'number' ? flat.paddingTop : gutter;
  const paddingTop = android && headerless ? Math.max(baseTop, insets.top + spacing.xl) : baseTop;
  const paddingBottom = android ? Math.max(spacing.xxxl, spacing.xl + insets.bottom) : spacing.xxxl;
  // Insets are physical (left/right); padding start/end are logical, so map them for RTL.
  const startInset = android ? (I18nManager.isRTL ? insets.right : insets.left) : 0;
  const endInset = android ? (I18nManager.isRTL ? insets.left : insets.right) : 0;

  const common = {
    style: { flex: 1, backgroundColor: colors.background },
    contentInsetAdjustmentBehavior: 'automatic' as const,
    keyboardShouldPersistTaps: 'handled' as const,
    keyboardDismissMode: 'interactive' as const,
    contentContainerStyle: [
      { padding: gutter, gap },
      contentContainerStyle,
      { paddingTop, paddingBottom, paddingStart: gutter + startInset, paddingEnd: gutter + endInset },
    ],
    refreshControl: onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} progressViewOffset={android && headerless ? insets.top : 0} /> : undefined,
  };
  if (keyboard) return <KeyboardAwareScrollView {...common} bottomOffset={spacing.xl}>{children}</KeyboardAwareScrollView>;
  return <ScrollView {...common}>{children}</ScrollView>;
}
